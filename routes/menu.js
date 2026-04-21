const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
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
router.get('/admin/menu', checkRole(['admin']), menuController.getMenuItems);
router.post('/admin/menu', checkRole(['admin']), upload.single('image'), menuController.createMenuItem);
router.post('/admin/menu/:id', checkRole(['admin']), upload.single('image'), menuController.editMenuItem);
router.delete('/admin/menu/:id', checkRole(['admin']), menuController.deleteMenuItem);
router.post('/admin/menu/:id/delete', checkRole(['admin']), menuController.deleteMenuItem);
router.put('/admin/menu/:id/stock', checkRole(['admin']), menuController.updateStock);
router.put('/admin/menu/:id/toggle', checkRole(['admin']), menuController.toggleAvailability);

// Public routes
router.get('/api/hotels/:hotelId/menu', menuController.getHotelMenu);

module.exports = router;
