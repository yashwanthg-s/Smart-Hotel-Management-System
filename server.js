require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const cors = require('cors');

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hotel-management')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-hotel-management'
  }),
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to attach user to locals
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  // Load hotel modules for admin users on every request
  if (req.session.user && req.session.user.role === 'admin' && req.session.user.hotelId) {
    try {
      if (!req.session.user.hotelModules) {
        const Hotel = require('./models/Hotel');
        const hotel = await Hotel.findById(req.session.user.hotelId).select('modules');
        if (hotel) {
          req.session.user.hotelModules = hotel.modules;
          res.locals.user = req.session.user;
        }
      }
    } catch (e) {}
  }
  // Also ensure userId is available
  if (req.session.user && !req.session.userId) {
    req.session.userId = req.session.user.id;
  }
  next();
});

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/hotel'));
app.use('/', require('./routes/menu'));
app.use('/', require('./routes/order'));
app.use('/', require('./routes/room'));
app.use('/', require('./routes/staff'));
app.use('/', require('./routes/table'));

// Service request API routes
const serviceController = require('./controllers/serviceController');
const { checkRole } = require('./middleware/auth');
app.get('/api/service-requests', checkRole(['staff']), serviceController.getServiceRequests);
app.get('/api/service-requests/done', checkRole(['staff']), serviceController.getDoneRequests);
app.post('/api/service-requests', checkRole(['staff']), serviceController.createServiceRequest);
app.put('/api/service-requests/:id', checkRole(['staff']), serviceController.updateServiceRequest);

// Housekeeping dashboard
app.get('/staff/housekeeping', async (req, res) => {
  if (!req.session.user || req.session.user.department !== 'housekeeping') return res.redirect('/login');
  res.render('staff/housekeeping', { hotelId: req.session.user.hotelId });
});

// Reception dashboard
app.get('/staff/reception', async (req, res) => {
  if (!req.session.user || req.session.user.department !== 'reception') return res.redirect('/login');
  res.render('staff/reception', { hotelId: req.session.user.hotelId });
});

// Home page
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.render('index');
});

// Dashboard router based on role
app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const { role, department } = req.session.user;

  if (role === 'superadmin') {
    return res.redirect('/superadmin/hotels');
  } else if (role === 'admin') {
    return res.redirect('/admin/dashboard');
  } else if (role === 'staff' && department === 'waiter') {
    return res.redirect('/waiter/dashboard');
  } else if (role === 'staff' && department === 'housekeeping') {
    return res.redirect('/staff/housekeeping');
  } else if (role === 'staff' && department === 'reception') {
    return res.redirect('/staff/reception');
  } else if (role === 'staff' && department === 'kitchen') {
    return res.redirect('/staff/orders');
  } else if (role === 'staff') {
    return res.redirect('/staff/orders');
  } else {
    return res.redirect('/user/dashboard');
  }
});

// Admin dashboard — also store hotel modules in session for sidebar
app.get('/admin/dashboard', async (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin' && req.session.user.hotelId) {
    try {
      const Hotel = require('./models/Hotel');
      const hotel = await Hotel.findById(req.session.user.hotelId);
      if (hotel) {
        req.session.user.hotelModules = hotel.modules;
        res.locals.user = req.session.user;

        // If only room booking enabled (no food), redirect to rooms page
        if (!hotel.modules.foodSystem && hotel.modules.roomBooking) {
          return res.redirect('/admin/rooms');
        }
      }
    } catch (e) {}
  }
  next();
});

// User dashboard
app.get('/user/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'user') {
    return res.redirect('/login');
  }
  try {
    // Always fetch fresh user data from DB so phone/name are up to date
    const User = require('./models/User');
    const freshUser = await User.findById(req.session.userId).select('-password');
    if (freshUser) {
      req.session.user.phone = freshUser.phone || null;
      req.session.user.name = freshUser.name;
    }
    res.render('user/dashboard');
  } catch (err) {
    res.render('user/dashboard');
  }
});

// Complaints routes
const Complaint = require('./models/Complaint');

// Super admin: view all complaints
app.get('/superadmin/complaints', checkRole(['superadmin']), async (req, res) => {
  const Payment = require('./models/Payment');
  const Order = require('./models/Order');

  const complaints = await Complaint.find()
    .populate('userId', 'name email')
    .populate('hotelId', 'name')
    .sort({ createdAt: -1 });

  // Attach payment + order info to each complaint
  const complaintsWithPayment = await Promise.all(complaints.map(async c => {
    const obj = c.toObject();
    if (c.orderId) {
      // Find payment by orderId (MongoDB _id)
      obj.paymentInfo = await Payment.findOne({ orderId: c.orderId });
      // Also get order details
      obj.orderInfo = await Order.findById(c.orderId).select('orderId totalPrice status');
    }
    return obj;
  }));

  res.render('superadmin/complaints', { complaints: complaintsWithPayment });
});

// Super admin: refund
app.post('/api/complaints/:id/refund', checkRole(['superadmin']), async (req, res) => {
  try {
    const { action, amount, reason } = req.body;
    const Payment = require('./models/Payment');
    const complaint = await Complaint.findById(req.params.id);

    if (action === 'approve') {
      await Complaint.findByIdAndUpdate(req.params.id, {
        refundStatus: 'approved', refundAmount: amount, status: 'resolved',
        adminReply: `Refund of ₹${amount} approved. Reason: ${reason}`
      });
      if (complaint.orderId) {
        await Payment.findOneAndUpdate(
          { orderId: complaint.orderId },
          { refundAmount: amount, refundReason: reason, refundedAt: new Date(), status: 'refunded' }
        );
      }
      // Notify user
      const Notification = require('./models/Notification');
      await Notification.create({
        userId: complaint.userId,
        title: '✅ Refund Approved!',
        message: `Your refund of ₹${amount} has been approved. Reason: ${reason}`,
        type: 'refund_approved'
      });
    } else {
      await Complaint.findByIdAndUpdate(req.params.id, {
        refundStatus: 'rejected', status: 'resolved',
        adminReply: `Refund rejected. Reason: ${reason}`
      });
      // Notify user
      const Notification = require('./models/Notification');
      await Notification.create({
        userId: complaint.userId,
        title: '❌ Refund Rejected',
        message: `Your refund request was rejected. Reason: ${reason}`,
        type: 'refund_rejected'
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// User: submit complaint
app.post('/api/complaints', checkRole(['user']), async (req, res) => {
  try {
    const { subject, message, category, hotelId, orderId } = req.body;
    const complaint = await Complaint.create({
      userId: req.session.userId,
      hotelId: hotelId || null,
      orderId: orderId || null,
      subject, message, category,
      refundStatus: 'none'
    });
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Super admin: reply to complaint
app.post('/api/complaints/:id/reply', checkRole(['superadmin']), async (req, res) => {
  try {
    const { reply } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      adminReply: reply, repliedAt: new Date(), status: 'resolved'
    }, { new: true });

    // Send notification to user
    const Notification = require('./models/Notification');
    await Notification.create({
      userId: complaint.userId,
      title: '📩 Admin replied to your complaint',
      message: reply,
      type: 'complaint_reply'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reply' });
  }
});

// Super admin: update complaint status
app.put('/api/complaints/:id/status', checkRole(['superadmin']), async (req, res) => {
  try {
    await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Staff: ETA snapshot for polling
app.get('/api/orders/eta-snapshot', checkRole(['staff', 'admin']), async (req, res) => {
  try {
    const Order = require('./models/Order');
    const hotelId = req.session.user.hotelId;
    const orders = await Order.find({
      hotelId,
      status: { $in: ['received', 'preparing'] }
    }).select('_id userETA userDistance status');
    res.json(orders.map(o => ({ id: o._id, eta: o.userETA, dist: o.userDistance, status: o.status })));
  } catch (err) {
    res.json([]);
  }
});

// Update order ETA (called from user's browser as they travel)
app.post('/api/orders/:id/eta', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { eta, distance } = req.body;
    const Order = require('./models/Order');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const prevETA = order.userETA;
    order.userETA = eta;
    order.userDistance = distance;

    // If ETA <= prep time and alert not sent yet → send staff notification
    const shouldAlert = eta <= order.estimatedPrepTime && !order.etaAlertSent &&
      ['received', 'preparing'].includes(order.status);

    if (shouldAlert) {
      order.etaAlertSent = true;
      const Notification = require('./models/Notification');
      const User = require('./models/User');
      const staffList = await User.find({ hotelId: order.hotelId, role: 'staff' });
      for (const staff of staffList) {
        await Notification.create({
          userId: staff._id,
          title: '🚨 Customer is on the way!',
          message: `Order ${order.orderId} — Customer arriving in ~${eta} min (${distance} km away). Start preparing now!`,
          type: 'order_ready'
        });
      }
    }

    await order.save();
    console.log(`[ETA DB] Order ${order.orderId}: ${eta} min, ${distance} km (prev: ${prevETA} min)`);
    res.json({ success: true, shouldAlert, eta, distance });
  } catch (err) {
    console.error('[ETA DB] Error:', err.message);
    res.status(500).json({ error: 'Failed to update ETA' });
  }
});

// Geocode proxy (avoids CORS issues with Nominatim)
app.get('/api/geocode', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'SmartHotelManagement/1.0 (hotel@example.com)' }
    });
    const data = await response.json();
    if (data.length > 0) {
      res.json({ lat: data[0].lat, lng: data[0].lon, display: data[0].display_name });
    } else {
      res.json({ error: 'Not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Geocode failed' });
  }
});

// ETA API - uses OpenRouteService (API key stays on backend only)
app.get('/api/eta', async (req, res) => {
  const { userLat, userLng, hotelLat, hotelLng } = req.query;

  if (!userLat || !userLng || !hotelLat || !hotelLng) {
    return res.status(400).json({ error: 'Missing coordinates: userLat, userLng, hotelLat, hotelLng required' });
  }

  try {
    const { calculateETA } = require('./services/etaService');
    const result = await calculateETA(
      parseFloat(userLat), parseFloat(userLng),
      parseFloat(hotelLat), parseFloat(hotelLng)
    );
    res.json(result);
  } catch (err) {
    console.error('[ETA Route] Error:', err.message);
    res.status(500).json({ error: 'ETA calculation failed', message: err.message });
  }
});

// Booking status update (admin)
app.put('/api/bookings/:id/status', checkRole(['admin']), async (req, res) => {
  try {
    const RoomBooking = require('./models/RoomBooking');
    await RoomBooking.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      updatedAt: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// User: get their room bookings
app.get('/api/my-bookings', checkRole(['user']), async (req, res) => {
  try {
    const RoomBooking = require('./models/RoomBooking');
    const bookings = await RoomBooking.find({ userId: req.session.userId })
      .populate('hotelId', 'name address')
      .populate('roomId', 'roomNumber roomType price images')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Notification API routes
const Notification = require('./models/Notification');
app.get('/api/notifications', checkRole(['user']), async (req, res) => {
  const notifs = await Notification.find({ userId: req.session.userId }).sort({ createdAt: -1 }).limit(20);
  res.json(notifs);
});
app.put('/api/notifications/:id/read', checkRole(['user']), async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
});
app.put('/api/notifications/read-all', checkRole(['user']), async (req, res) => {
  await Notification.updateMany({ userId: req.session.userId }, { read: true });
  res.json({ success: true });
});
app.post('/api/user/update-profile', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { name, phone } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const User = require('./models/User');
    await User.findByIdAndUpdate(req.session.userId, { name, phone });
    if (req.session.user) { req.session.user.name = name; req.session.user.phone = phone; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// API: Update user phone
app.post('/api/user/update-phone', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { phone } = req.body;
    const User = require('./models/User');
    await User.findByIdAndUpdate(req.session.userId, { phone });
    if (req.session.user) req.session.user.phone = phone;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update phone' });
  }
});
app.get('/waiter/dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'staff' || req.session.user.department !== 'waiter') {
    return res.redirect('/login');
  }
  try {
    const Table = require('./models/Table');
    const Order = require('./models/Order');
    const hotelId = req.session.user.hotelId;
    const tables = await Table.find({ hotelId, isActive: true }).sort({ tableNumber: 1 });

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

    // Today's orders by this waiter
    const todayOrders = await Order.find({
      hotelId,
      placedBy: req.session.userId,
      createdAt: { $gte: startOfDay }
    }).sort({ createdAt: -1 });

    // All historical orders (before today)
    const historyOrders = await Order.find({
      hotelId,
      placedBy: req.session.userId,
      createdAt: { $lt: startOfDay }
    }).sort({ createdAt: -1 }).limit(100);

    res.render('waiter/dashboard', { tables, hotelId, todayOrders, historyOrders });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load waiter dashboard' });
  }
});

// User: Book rooms page
app.get('/user/book-rooms/:hotelId', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'user') return res.redirect('/login');
  try {
    const Hotel = require('./models/Hotel');
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return res.status(404).render('error', { message: 'Hotel not found' });
    if (!hotel.modules.roomBooking) return res.status(403).render('error', { message: 'Room booking not available for this hotel' });
    res.render('user/book-rooms', { hotel });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load room booking page' });
  }
});

// User: Order food page
app.get('/user/order-food/:hotelId', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'user') {
    return res.redirect('/login');
  }
  try {
    const Hotel = require('./models/Hotel');
    const MenuItem = require('./models/MenuItem');
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) return res.status(404).render('error', { message: 'Hotel not found' });
    // Fetch ALL items — unavailable ones will show as greyed out
    const menuItems = await MenuItem.find({ hotelId: req.params.hotelId });
    res.render('user/order-food', { hotel, menuItems, orderingEnabled: hotel.orderingEnabled });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load menu' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', { message: 'Something went wrong' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
