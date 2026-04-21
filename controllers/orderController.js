const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const QRCode = require('qrcode');
const crypto = require('crypto');

// User: Create order
exports.createOrder = async (req, res) => {
  try {
    const { hotelId, items, totalPrice, roomNumber, notes } = req.body;
    const userId = req.session.userId;

    // Check if ordering is enabled for this hotel
    const Hotel = require('../models/Hotel');
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ error: 'Hotel not found' });
    if (!hotel.orderingEnabled) {
      return res.status(403).json({ error: 'Ordering is currently disabled by the hotel. Please try again later.' });
    }

    // Calculate max prep time
    let maxPrepTime = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (menuItem && menuItem.prepTime > maxPrepTime) {
        maxPrepTime = menuItem.prepTime;
      }
      // Update active orders count
      menuItem.activeOrders += item.quantity;
      await menuItem.save();
    }

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const order = new Order({
      hotelId,
      userId: userId || req.session.userId,
      items,
      totalPrice: parseFloat(totalPrice),
      estimatedPrepTime: maxPrepTime,
      orderId,
      roomNumber,
      notes,
      status: 'pending',
      placedBy: req.session.userId,
      // Store ETA at order creation time
      userETA: req.body.userETA || null,
      userDistance: req.body.userDistance || null
    });

    await order.save();

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(orderId);
    order.qrCode = qrCodeData;
    await order.save();

    // If ETA was provided at order time and already <= prepTime, alert staff immediately
    if (order.userETA !== null && order.userETA <= maxPrepTime) {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      const staffList = await User.find({ hotelId, role: 'staff' });
      for (const staff of staffList) {
        await Notification.create({
          userId: staff._id,
          title: '🚨 New Order — Customer is close!',
          message: `Order ${orderId} — Customer only ${order.userETA} min away (${order.userDistance} km). Prep time: ${maxPrepTime} min. Accept and start preparing!`,
          type: 'order_ready'
        });
      }
    }

    // Create payment record with 10% platform commission
    const Payment = require('../models/Payment');
    const commissionRate = 10;
    const platformFee = Math.round(parseFloat(totalPrice) * commissionRate / 100);
    const hotelAmount = parseFloat(totalPrice) - platformFee;

    await Payment.create({
      orderId: order._id,
      userId: userId || req.session.userId,
      hotelId,
      totalAmount: parseFloat(totalPrice),
      platformFee,
      hotelAmount,
      commissionRate,
      paymentMethod: req.body.paymentMethod || 'card',
      status: 'completed'
    });

    res.json({ success: true, order, qrCode: qrCodeData });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// User: Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.session.userId;
    const orders = await Order.find({ userId })
      .populate('hotelId', 'name latitude longitude')
      .populate('items.menuItemId', 'name')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Staff & Admin: Get pending orders
exports.getPendingOrders = async (req, res) => {
  try {
    const user = req.session.user;
    const hotelId = user.hotelId;

    if (!hotelId) {
      return res.status(400).render('error', { message: 'No hotel assigned to your account' });
    }

    const orders = await Order.find({
      hotelId,
      status: { $in: ['pending', 'received', 'preparing', 'ready'] }
    })
      .populate('userId', 'name phone')
      .populate('items.menuItemId', 'name prepTime')
      .sort({ createdAt: 1 });

    res.render('staff/orders', { orders });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).render('error', { message: 'Failed to fetch orders' });
  }
};

// Staff: Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['received', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (status === 'completed') {
      order.completedAt = new Date();
      await order.save();

      // Decrease active orders count
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (menuItem) {
          menuItem.activeOrders = Math.max(0, menuItem.activeOrders - item.quantity);
          await menuItem.save();
        }
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

// Staff: Verify QR code and auto-update status to received
exports.verifyQRCode = async (req, res) => {
  try {
    const { orderId } = req.body;
    const hotelId = req.session.user.hotelId;

    const order = await Order.findOne({ orderId })
      .populate('items.menuItemId', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ensure order belongs to this hotel
    if (order.hotelId.toString() !== hotelId.toString()) {
      return res.status(403).json({ error: 'Order does not belong to your hotel' });
    }

    // Block if QR already used
    if (order.qrUsed) {
      return res.status(400).json({ 
        error: '❌ QR Code already used. This order is already completed.',
        alreadyUsed: true,
        order 
      });
    }

    // Block if order cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'This order has been cancelled' });
    }

    // Only complete if order is ready
    if (order.status === 'ready') {
      order.status = 'completed';
      order.completedAt = new Date();
      order.qrUsed = true; // One-time use
      await order.save();

      // Decrease active orders count
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (menuItem) {
          menuItem.activeOrders = Math.max(0, menuItem.activeOrders - item.quantity);
          await menuItem.save();
        }
      }

      return res.json({ success: true, order, message: '✅ Order completed successfully!' });
    }

    // If order is not ready yet, just show current status
    return res.json({ 
      success: false, 
      notReady: true,
      error: `Order is not ready yet. Current status: ${order.status.toUpperCase()}`,
      order
    });

  } catch (error) {
    console.error('Error verifying QR code:', error);
    res.status(500).json({ error: 'Failed to verify QR code' });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('hotelId', 'name')
      .populate('items.menuItemId', 'name price');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

// User: Rate a completed order
exports.rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { stars, review } = req.body;
    const userId = req.session.userId;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findOne({ _id: id, userId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'completed') return res.status(400).json({ error: 'Can only rate completed orders' });
    if (order.rating.stars) return res.status(400).json({ error: 'Already rated' });

    order.rating = { stars: parseInt(stars), review: review || '', ratedAt: new Date() };
    await order.save();

    res.json({ success: true, message: 'Thank you for your rating!' });
  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};
