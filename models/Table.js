const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'rooftop', 'private'],
    default: 'indoor'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Table', tableSchema);
