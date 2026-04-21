const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    name: String,
    price: Number,
    quantity: Number,
    prepTime: Number
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  // Maximum prep time among all items
  estimatedPrepTime: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  // QR code for verification
  qrCode: String,
  qrUsed: {
    type: Boolean,
    default: false
  },
  // Who placed the order (waiter or user)
  placedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Rating after completion
  rating: {
    stars: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: null },
    ratedAt: { type: Date, default: null }
  },
  orderId: {
    type: String,
    unique: true
  },
  // Payment info
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  // Room number if applicable
  roomNumber: String,
  notes: String,
  // ETA tracking
  userETA: {
    type: Number,  // minutes
    default: null
  },
  userDistance: {
    type: Number,  // km
    default: null
  },
  etaAlertSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Order', orderSchema);
