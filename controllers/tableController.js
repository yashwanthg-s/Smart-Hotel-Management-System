const Table = require('../models/Table');

// Get all tables
exports.getTables = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;

    if (!hotelId) {
      return res.status(400).render('error', { message: 'No hotel assigned to your account' });
    }

    const tables = await Table.find({ hotelId, isActive: true })
      .populate('currentOrderId', 'orderId totalPrice status')
      .sort({ tableNumber: 1 });

    const stats = {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length,
      maintenance: tables.filter(t => t.status === 'maintenance').length
    };

    const error = req.query.error || null;

    res.render('admin/tables', { tables, stats, error });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).render('error', { message: 'Failed to fetch tables: ' + error.message });
  }
};

// Create table
exports.createTable = async (req, res) => {
  try {
    const hotelId = req.session.user.hotelId;
    const { tableNumber, capacity, location } = req.body;

    // Check duplicate table number
    const existing = await Table.findOne({ hotelId, tableNumber });
    if (existing) {
      return res.redirect('/admin/tables?error=Table+number+already+exists');
    }

    await Table.create({ hotelId, tableNumber, capacity: parseInt(capacity), location });
    res.redirect('/admin/tables');
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).render('error', { message: 'Failed to create table' });
  }
};

// Update table
exports.updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tableNumber, capacity, location, status } = req.body;
    await Table.findByIdAndUpdate(id, { tableNumber, capacity: parseInt(capacity), location, status });
    res.redirect('/admin/tables');
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).render('error', { message: 'Failed to update table' });
  }
};

// Update table status only (quick toggle)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await Table.findByIdAndUpdate(id, { status });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// Delete table
exports.deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    await Table.findByIdAndDelete(id);
    res.redirect('/admin/tables');
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).render('error', { message: 'Failed to delete table' });
  }
};
