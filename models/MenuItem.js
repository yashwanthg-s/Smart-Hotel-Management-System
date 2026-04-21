const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['appetizer', 'main', 'dessert', 'beverage', 'snack'],
    default: 'main'
  },
  prepTime: {
    type: Number, // in minutes
    required: true
  },
  image: String,
  // Stock management
  stock: {
    type: Number,
    default: 100
  },
  maxStock: {
    type: Number,
    default: 100
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  // Demand tracking
  activeOrders: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
