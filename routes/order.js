const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { checkRole } = require('../middleware/auth');

// User routes
router.post('/api/orders', checkRole(['user', 'staff']), orderController.createOrder);
router.get('/api/orders', checkRole(['user']), orderController.getUserOrders);
router.get('/api/orders/:id', checkRole(['user', 'staff', 'admin']), orderController.getOrderDetails);
router.post('/api/orders/:id/rate', checkRole(['user']), orderController.rateOrder);

// Staff & Admin routes
router.get('/staff/orders', checkRole(['staff', 'admin']), orderController.getPendingOrders);
router.put('/staff/orders/:id/status', checkRole(['staff', 'admin']), orderController.updateOrderStatus);
router.post('/staff/orders/verify-qr', checkRole(['staff', 'admin']), orderController.verifyQRCode);

module.exports = router;
