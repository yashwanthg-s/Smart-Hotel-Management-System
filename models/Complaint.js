const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: ['food_quality', 'service', 'cleanliness', 'billing', 'staff', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open'
  },
  adminReply: { type: String, default: null },
  repliedAt: { type: Date, default: null },
  // Refund
  refundRequested: { type: Boolean, default: false },
  refundAmount: { type: Number, default: 0 },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', complaintSchema);
