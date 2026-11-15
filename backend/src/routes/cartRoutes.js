const express = require('express');
const router = express.Router();
const { Product } = require('../models');

// Helper to initialize and calculate cart totals
function calculateCart(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    cart = { items: [] };
  }

  let subtotal = 0;
  let totalItems = 0;

  cart.items.forEach(item => {
    item.subtotal = parseFloat((item.price * item.quantity).toFixed(2));
    subtotal += item.subtotal;
    totalItems += item.quantity;
  });

  subtotal = parseFloat(subtotal.toFixed(2));
  const shippingFee = subtotal > 0 && subtotal < 50 ? 9.99 : 0;
  const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% tax
  const totalAmount = parseFloat((subtotal + shippingFee + tax).toFixed(2));

  return {
    items: cart.items,
    totalItems,
    subtotal,
    shippingFee,
    tax,
    totalAmount
  };
}

// GET /api/cart
router.get('/', (req, res) => {
  if (!req.session.cart) {
    req.session.cart = { items: [] };
  }
  const summary = calculateCart(req.session.cart);
  res.json({ success: true, cart: summary });
});

// POST /api/cart/add
router.post('/add', async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10) || 1;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    if (!req.session.cart) {
      req.session.cart = { items: [] };
    }

    const existingIndex = req.session.cart.items.findIndex(i => i.productId === String(productId));

    if (existingIndex > -1) {
      const newQty = req.session.cart.items[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stock} units available in stock.`
        });
      }
      req.session.cart.items[existingIndex].quantity = newQty;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          error: `Only ${product.stock} units available in stock.`
        });
      }
      req.session.cart.items.push({
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: qty
      });
    }

    const summary = calculateCart(req.session.cart);
    res.json({
      success: true,
      message: `Added "${product.name}" to cart.`,
      cart: summary
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/update
router.post('/update', async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    if (!req.session.cart) {
      req.session.cart = { items: [] };
    }

    const product = await Product.findById(productId);
    const existingIndex = req.session.cart.items.findIndex(i => i.productId === String(productId));

    if (existingIndex > -1) {
      if (qty <= 0) {
        // Remove item if quantity is 0 or negative
        req.session.cart.items.splice(existingIndex, 1);
      } else {
        if (product && qty > product.stock) {
          return res.status(400).json({
            success: false,
            error: `Only ${product.stock} units available in stock.`
          });
        }
        req.session.cart.items[existingIndex].quantity = qty;
      }
    }

    const summary = calculateCart(req.session.cart);
    res.json({
      success: true,
      message: 'Cart updated.',
      cart: summary
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/remove
router.post('/remove', (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, error: 'Product ID is required.' });
  }

  if (req.session.cart && req.session.cart.items) {
    req.session.cart.items = req.session.cart.items.filter(i => i.productId !== String(productId));
  }

  const summary = calculateCart(req.session.cart);
  res.json({
    success: true,
    message: 'Item removed from cart.',
    cart: summary
  });
});

// POST /api/cart/clear
router.post('/clear', (req, res) => {
  req.session.cart = { items: [] };
  const summary = calculateCart(req.session.cart);
  res.json({
    success: true,
    message: 'Cart cleared.',
    cart: summary
  });
});

module.exports = router;
