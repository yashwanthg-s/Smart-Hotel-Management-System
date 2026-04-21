const Hotel = require('../models/Hotel');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Room = require('../models/Room');
const Order = require('../models/Order');
const RoomBooking = require('../models/RoomBooking');

// Super Admin: Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .populate('adminId', 'name email')
      .populate('staff', 'name email department');
    
    res.render('superadmin/hotels', { hotels });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).render('error', { message: 'Failed to fetch hotels' });
  }
};

// Super Admin: Create hotel
exports.createHotel = async (req, res) => {
  try {
    const { name, description, address, latitude, longitude, phone, email, adminName, adminEmail, adminPassword, adminPhone } = req.body;

    // Validate admin credentials
    if (!adminName || !adminEmail || !adminPassword) {
      return res.status(400).render('error', { message: 'Admin name, email, and password are required' });
    }

    // Check if admin email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(400).render('error', { message: 'Admin email already exists' });
    }

    // Create admin user
    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: adminPhone,
      role: 'admin'
    });

    await admin.save();

    // Create hotel with the admin
    const hotel = new Hotel({
      name,
      description,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      phone,
      email,
      adminId: admin._id,
      isActive: true,
      modules: {
        foodSystem: req.body.foodSystem === 'on',
        roomBooking: req.body.roomBooking === 'on'
      }
    });

    await hotel.save();

    // Update admin with hotel reference
    admin.hotelId = hotel._id;
    await admin.save();

    res.redirect('/superadmin/hotels');
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).render('error', { message: 'Failed to create hotel: ' + error.message });
  }
};

// Super Admin: Edit hotel
exports.editHotel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, latitude, longitude, phone, email } = req.body;

    await Hotel.findByIdAndUpdate(id, {
      name,
      description,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      phone,
      email
    });

    res.redirect('/superadmin/hotels');
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).render('error', { message: 'Failed to update hotel' });
  }
};

// Super Admin: Delete hotel
exports.deleteHotel = async (req, res) => {
  try {
    const { id } = req.params;
    await Hotel.findByIdAndDelete(id);
    res.redirect('/superadmin/hotels');
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).render('error', { message: 'Failed to delete hotel' });
  }
};

// Super Admin: Toggle module
exports.toggleModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { module } = req.body;

    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    if (module === 'foodSystem') {
      hotel.modules.foodSystem = !hotel.modules.foodSystem;
    } else if (module === 'roomBooking') {
      hotel.modules.roomBooking = !hotel.modules.roomBooking;
    }

    await hotel.save();
    res.json({ success: true, modules: hotel.modules });
  } catch (error) {
    console.error('Error toggling module:', error);
    res.status(500).json({ error: 'Failed to toggle module' });
  }
};

// Admin: Toggle ordering on/off
exports.toggleOrdering = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const hotel = await Hotel.findById(hotelId);
    hotel.orderingEnabled = !hotel.orderingEnabled;
    await hotel.save();
    res.json({ success: true, orderingEnabled: hotel.orderingEnabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle ordering' });
  }
};

// Admin: Get hotel dashboard
exports.getAdminDashboard = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const hotel = await Hotel.findById(hotelId)
      .populate('adminId', 'name email')
      .populate('staff', 'name email department');

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    // All orders today (any status)
    const allOrdersToday = await Order.find({
      hotelId,
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).populate('userId', 'name phone').sort({ createdAt: -1 });

    // Completed orders today for revenue
    const completedOrdersToday = allOrdersToday.filter(o => o.status === 'completed');

    const topItems = await MenuItem.find({ hotelId })
      .sort({ activeOrders: -1 })
      .limit(5);

    const totalRevenue = completedOrdersToday.reduce((sum, order) => sum + order.totalPrice, 0);

    res.render('admin/dashboard', {
      hotel,
      ordersToday: allOrdersToday.length,
      completedOrders: completedOrdersToday,
      totalRevenue,
      topItems,
      orderingEnabled: hotel.orderingEnabled,
      modules: hotel.modules
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).render('error', { message: 'Failed to load dashboard' });
  }
};

// Get hotel details for user
exports.getHotelDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findById(id);

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }

    res.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    res.status(500).json({ error: 'Failed to fetch hotel details' });
  }
};

// Get all hotels for user (only hotels with food system enabled)
exports.getHotelsForUser = async (req, res) => {
  try {
    const hotels = await Hotel.find({ 
      isActive: true,
      'modules.foodSystem': true  // only show hotels with food ordering enabled
    }).select('name description address latitude longitude phone email modules image');
    res.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};

// Super Admin: User Analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('adminId', 'name');
    const totalUsers = await User.countDocuments({ role: 'user' });

    const allOrders = await Order.find()
      .populate('userId', 'name email')
      .populate('hotelId', 'name');

    // Users who ordered (unique)
    const orderedUserIds = [...new Set(allOrders.map(o => o.userId?._id?.toString()).filter(Boolean))];
    const usersWhoOrdered = orderedUserIds.length;

    // Users who rated
    const usersWhoRated = [...new Set(
      allOrders.filter(o => o.rating && o.rating.stars)
        .map(o => o.userId?._id?.toString()).filter(Boolean)
    )].length;

    // Per hotel breakdown
    const hotelBreakdown = await Promise.all(hotels.map(async hotel => {
      const hotelOrders = allOrders.filter(o => o.hotelId?._id?.toString() === hotel._id.toString());
      const uniqueUsers = [...new Set(hotelOrders.map(o => o.userId?._id?.toString()).filter(Boolean))].length;
      const completedOrders = hotelOrders.filter(o => o.status === 'completed').length;
      const revenue = hotelOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalPrice, 0);

      // Avg rating
      const ratedOrders = hotelOrders.filter(o => o.rating && o.rating.stars);
      const avgRating = ratedOrders.length > 0
        ? ratedOrders.reduce((s, o) => s + o.rating.stars, 0) / ratedOrders.length : 0;

      // Top items
      const itemCounts = {};
      hotelOrders.forEach(order => {
        order.items.forEach(item => {
          const name = item.name || 'Unknown';
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        });
      });
      const topItems = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      return {
        hotelName: hotel.name,
        adminName: hotel.adminId?.name || 'N/A',
        totalOrders: hotelOrders.length,
        uniqueUsers, completedOrders, revenue,
        avgRating, topItems
      };
    }));

    // Top users by order count
    const userStats = {};
    allOrders.forEach(order => {
      if (!order.userId) return;
      const uid = order.userId._id.toString();
      if (!userStats[uid]) {
        userStats[uid] = {
          name: order.userId.name,
          email: order.userId.email,
          orderCount: 0, totalSpent: 0,
          ratings: [], lastOrder: null
        };
      }
      userStats[uid].orderCount++;
      userStats[uid].totalSpent += order.totalPrice;
      if (order.rating?.stars) userStats[uid].ratings.push(order.rating.stars);
      if (!userStats[uid].lastOrder || order.createdAt > userStats[uid].lastOrder) {
        userStats[uid].lastOrder = order.createdAt;
      }
    });

    const topUsers = Object.values(userStats)
      .map(u => ({
        ...u,
        avgRating: u.ratings.length > 0 ? u.ratings.reduce((a, b) => a + b, 0) / u.ratings.length : 0
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10);

    // Daily users who ordered - last 14 days
    const dailyLabels = [];
    const dailyOrderingUsers = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const dayOrders = await Order.find({ createdAt: { $gte: start, $lte: end } });
      const uniqueUsersToday = [...new Set(dayOrders.map(o => o.userId?.toString()).filter(Boolean))].length;
      dailyLabels.push(start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
      dailyOrderingUsers.push(uniqueUsersToday);
    }

    res.render('superadmin/user-analytics', {
      totalUsers, usersWhoOrdered, usersWhoRated,
      hotelBreakdown, topUsers,
      dailyLabels, dailyOrderingUsers
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).render('error', { message: 'Failed to load user analytics' });
  }
};

// Super Admin: Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const hotels = await Hotel.find().populate('adminId', 'name email');
    const totalHotels = hotels.length;
    const totalUsers = await User.countDocuments({ role: 'user' });
    const allOrders = await Order.find();
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Orders per day - last 7 days
    const chartLabels = [];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const count = await Order.countDocuments({ createdAt: { $gte: start, $lte: end } });
      chartLabels.push(start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      chartData.push(count);
    }

    // Orders by status
    const statuses = ['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'];
    const statusLabels = statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const statusData = await Promise.all(
      statuses.map(s => Order.countDocuments({ status: s }))
    );

    // Per-hotel stats
    const hotelStats = await Promise.all(hotels.map(async (hotel) => {
      const orders = await Order.find({ hotelId: hotel._id });
      const revenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalPrice, 0);
      return {
        hotelId: hotel._id,
        name: hotel.name,
        adminName: hotel.adminId ? hotel.adminId.name : 'N/A',
        orderCount: orders.length,
        revenue,
        foodSystem: hotel.modules.foodSystem,
        roomBooking: hotel.modules.roomBooking
      };
    }));

    res.render('superadmin/analytics', {
      totalHotels, totalOrders, totalUsers, totalRevenue,
      chartLabels, chartData,
      statusLabels, statusData,
      hotelStats
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).render('error', { message: 'Failed to load analytics' });
  }
};

// Super Admin: Per-Hotel Analytics
exports.getHotelAnalytics = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId).populate('adminId', 'name email');
    if (!hotel) return res.status(404).render('error', { message: 'Hotel not found' });

    const allOrders = await Order.find({ hotelId });
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalPrice, 0);
    const totalUsers = [...new Set(allOrders.map(o => o.userId?.toString()).filter(Boolean))].length;

    // Status distribution
    const statuses = ['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'];
    const statusLabels = statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const statusData = statuses.map(s => allOrders.filter(o => o.status === s).length);

    // Orders growth - last 7 days
    const chartLabels = [];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end = new Date(date.setHours(23, 59, 59, 999));
      const count = await Order.countDocuments({ hotelId, createdAt: { $gte: start, $lte: end } });
      chartLabels.push(start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
      chartData.push(count);
    }

    // Top menu items
    const itemCounts = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const name = item.name || 'Unknown';
        itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
      });
    });
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    res.render('superadmin/hotel-analytics', {
      hotel, totalOrders, totalRevenue, totalUsers,
      chartLabels, chartData, statusLabels, statusData, topItems
    });
  } catch (error) {
    console.error('Hotel analytics error:', error);
    res.status(500).render('error', { message: 'Failed to load hotel analytics' });
  }
};
