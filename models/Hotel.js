const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  address: String,
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  phone: String,
  email: String,
  // Admin who manages this hotel
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Modules enabled for this hotel
  modules: {
    foodSystem: {
      type: Boolean,
      default: true
    },
    roomBooking: {
      type: Boolean,
      default: true
    }
  },
  // Admin can toggle ordering on/off
  orderingEnabled: {
    type: Boolean,
    default: true
  },
  // Hotel image/logo
  image: String,
  // Staff members assigned to this hotel
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Hotel', hotelSchema);
