const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please enter product description']
    },
    category: {
      type: String,
      required: [true, 'Please select or enter a category'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Price must be positive']
    },
    stock: {
      type: Number,
      required: [true, 'Please enter stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    image: {
      type: String,
      required: [true, 'Please enter product image URL']
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 12
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Product', productSchema);
