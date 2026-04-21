const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { checkRole } = require('../middleware/auth');

// Super Admin routes
router.get('/superadmin/hotels', checkRole(['superadmin']), hotelController.getAllHotels);
router.post('/superadmin/hotels', checkRole(['superadmin']), hotelController.createHotel);
router.post('/superadmin/hotels/:id', checkRole(['superadmin']), hotelController.editHotel);
router.delete('/superadmin/hotels/:id', checkRole(['superadmin']), hotelController.deleteHotel);
router.post('/superadmin/hotels/:id/delete', checkRole(['superadmin']), hotelController.deleteHotel);
router.post('/superadmin/hotels/:id/toggle-module', checkRole(['superadmin']), hotelController.toggleModule);
router.get('/superadmin/analytics', checkRole(['superadmin']), hotelController.getAnalytics);
router.get('/superadmin/user-analytics', checkRole(['superadmin']), hotelController.getUserAnalytics);
router.get('/superadmin/hotel-analytics/:hotelId', checkRole(['superadmin']), hotelController.getHotelAnalytics);

// Super Admin: Users list
router.get('/superadmin/users', checkRole(['superadmin']), async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ role: { $ne: 'superadmin' } })
      .populate('hotelId', 'name')
      .sort({ createdAt: -1 });
    res.render('superadmin/users', { users });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load users' });
  }
});

// Admin routes
router.get('/admin/dashboard', checkRole(['admin']), hotelController.getAdminDashboard);
router.post('/admin/toggle-ordering', checkRole(['admin']), hotelController.toggleOrdering);

// Public routes
router.get('/api/hotels', hotelController.getHotelsForUser);
router.get('/api/hotels-rooms', async (req, res) => {
  try {
    const Hotel = require('../models/Hotel');
    const hotels = await Hotel.find({ isActive: true, 'modules.roomBooking': true })
      .select('name description address latitude longitude');
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
});
router.get('/api/hotels/:id', hotelController.getHotelDetails);

module.exports = router;
