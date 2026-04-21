const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { checkRole } = require('../middleware/auth');

router.get('/admin/staff', checkRole(['admin']), staffController.getStaff);
router.post('/admin/staff', checkRole(['admin']), staffController.createStaff);
router.post('/admin/staff/:id', checkRole(['admin']), staffController.editStaff);
router.post('/admin/staff/:id/delete', checkRole(['admin']), staffController.deleteStaff);

module.exports = router;
