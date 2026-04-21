const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  tableNumber: String,
  type: {
    type: String,
    enum: ['water', 'bill', 'clean', 'extra_cutlery', 'napkins', 'sauce', 'custom'],
    required: true
  },
  customNote: String,
  assignedDepartment: {
    type: String,
    enum: ['housekeeping', 'reception'],
    default: 'housekeeping'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'done'],
    default: 'pending'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
