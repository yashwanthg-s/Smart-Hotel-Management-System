const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },

  totalAmount: { type: Number, required: true },       // Full order amount (e.g. ₹100)
  platformFee: { type: Number, required: true },        // Super admin cut (e.g. ₹10)
  hotelAmount: { type: Number, required: true },        // Hotel gets (e.g. ₹90)
  commissionRate: { type: Number, default: 10 },        // % commission

  paymentMethod: { type: String, enum: ['cash', 'card', 'upi'], default: 'card' },
  status: {
    type: String,
    enum: ['pending', 'completed', 'refunded', 'partial_refund'],
    default: 'pending'
  },

  // Refund details
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String, default: null },
  refundedAt: { type: Date, default: null },
  refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
