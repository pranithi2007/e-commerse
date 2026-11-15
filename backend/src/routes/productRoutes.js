const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/products/categories
router.get('/categories', async (req, res, next) => {
  try {
    const products = await Product.find({});
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean);
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/products
router.get('/', async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, sort, featured } = req.query;
    let products = await Product.find({});

    // Filter by search query
    if (q && q.trim()) {
      const term = q.trim().toLowerCase();
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term))
      );
    }

    // Filter by category
    if (category && category !== 'All' && category !== '') {
      products = products.filter(p => p.category === category);
    }

    // Filter by price
    if (minPrice !== undefined && minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        products = products.filter(p => p.price >= min);
      }
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        products = products.filter(p => p.price <= max);
      }
    }

    // Filter by featured
    if (featured === 'true') {
      products = products.filter(p => p.featured === true);
    }

    // Sorting
    if (sort === 'price-asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'name-asc') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'rating') {
      products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Default: featured first, then newest
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products (Admin Only)
router.post('/', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const { name, description, price, category, imageUrl, stock, featured } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ success: false, error: 'Name, price, and category are required.' });
    }

    const newProduct = await Product.create({
      name: name.trim(),
      description: description ? description.trim() : 'Premium quality product.',
      price: parseFloat(price),
      category: category.trim(),
      imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      stock: parseInt(stock, 10) || 20,
      featured: Boolean(featured),
      rating: 4.5
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully!',
      product: newProduct
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id (Admin Only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock, 10);
    if (updates.featured !== undefined) updates.featured = Boolean(updates.featured);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({
      success: true,
      message: 'Product updated successfully!',
      product: updated
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (Admin Only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Product deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
