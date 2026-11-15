const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price must be positive']
  },
  category: {
    type: String,
    required: [true, 'Please specify product category'],
    enum: ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports & Fitness', 'Books & Media'],
    default: 'Electronics'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60'
  },
  stock: {
    type: Number,
    required: true,
    default: 25,
    min: 0
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  featured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
