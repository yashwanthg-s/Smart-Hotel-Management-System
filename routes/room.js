const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { checkRole } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Admin routes
router.get('/admin/rooms', checkRole(['admin']), roomController.getRooms);
router.get('/admin/bookings', checkRole(['admin']), async (req, res) => {
  try {
    const RoomBooking = require('../models/RoomBooking');
    const hotelId = req.session.user.hotelId;
    const bookings = await RoomBooking.find({ hotelId })
      .populate('userId', 'name phone email')
      .populate('roomId', 'roomNumber roomType')
      .sort({ createdAt: -1 });
    res.render('admin/bookings', { bookings });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to load bookings' });
  }
});
router.post('/admin/rooms', checkRole(['admin']), upload.array('images', 5), roomController.createRoom);
router.post('/admin/rooms/:id', checkRole(['admin']), upload.array('images', 5), roomController.editRoom);
router.delete('/admin/rooms/:id', checkRole(['admin']), roomController.deleteRoom);
router.post('/admin/rooms/:id/delete', checkRole(['admin']), roomController.deleteRoom);

// User routes
router.get('/api/hotels/:hotelId/rooms', roomController.getAvailableRooms);
router.get('/api/rooms/:id', roomController.getRoomDetails);
router.post('/api/bookings', checkRole(['user']), roomController.createRoomBooking);
router.get('/api/bookings', checkRole(['user']), roomController.getUserBookings);

module.exports = router;
