const mongoose = require('mongoose');

const transitionHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    previousState: {
      type: String,
      required: true
    },
    previousStateName: {
      type: String
    },
    inputSymbol: {
      type: String,
      required: true
    },
    nextState: {
      type: String,
      default: null
    },
    nextStateName: {
      type: String,
      default: null
    },
    validationResult: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedByName: {
      type: String
    },
    updatedByRole: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TransitionHistory', transitionHistorySchema);
