const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { checkRole } = require('../middleware/auth');

router.get('/admin/tables', checkRole(['admin']), tableController.getTables);
router.post('/admin/tables', checkRole(['admin']), tableController.createTable);
router.post('/admin/tables/:id', checkRole(['admin']), tableController.updateTable);
router.put('/admin/tables/:id/status', checkRole(['admin']), tableController.updateStatus);
router.post('/admin/tables/:id/delete', checkRole(['admin']), tableController.deleteTable);

module.exports = router;
