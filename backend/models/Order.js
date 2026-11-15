const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true }
});

const deliveryAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'India' },
  phone: { type: String, required: true }
});

const orderTransitionSchema = new mongoose.Schema({
  previousState: { type: String, required: true },
  previousStateName: { type: String },
  inputSymbol: { type: String, required: true },
  nextState: { type: String, default: null },
  nextStateName: { type: String, default: null },
  validationResult: {
    type: String,
    enum: ['ACCEPTED', 'REJECTED'],
    required: true
  },
  reason: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String, default: 'System' },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      required: true
    },
    paymentMethod: {
      type: String,
      default: 'Simulated Card Payment (Academic Demo)'
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Completed'
    },
    currentStatus: {
      code: {
        type: String,
        enum: ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
        default: 'S0'
      },
      name: {
        type: String,
        default: 'Order Placed'
      }
    },
    transitionHistory: [orderTransitionSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
