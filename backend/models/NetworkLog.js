const mongoose = require('mongoose');

const networkLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
    },
    endpoint: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true
    },
    responseTime: {
      type: Number, // milliseconds
      required: true
    },
    ip: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    protocol: {
      type: String,
      default: 'HTTP/1.1'
    },
    contentLength: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'CLIENT_ERROR', 'SERVER_ERROR'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('NetworkLog', networkLogSchema);
