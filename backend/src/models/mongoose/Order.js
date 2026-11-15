const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
  fromState: {
    type: String,
    required: true
  },
  toState: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  actionLabel: {
    type: String,
    required: true
  },
  changedBy: {
    type: String,
    default: 'System'
  },
  note: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  imageUrl: {
    type: String
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: {
    fullName: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  payment: {
    method: {
      type: String,
      enum: ['Simulated Card', 'Cash on Delivery', 'UPI / NetBanking'],
      default: 'Simulated Card'
    },
    status: {
      type: String,
      enum: ['PAID', 'PENDING', 'CANCELLED'],
      default: 'PAID'
    },
    transactionId: { type: String },
    last4: { type: String, default: '4242' }
  },
  // DFA State Tracking
  currentState: {
    type: String,
    enum: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    default: 'S0',
    required: true
  },
  currentStateLabel: {
    type: String,
    default: 'Order Placed'
  },
  isTerminal: {
    type: Boolean,
    default: false
  },
  history: [orderHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
