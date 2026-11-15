const express = require('express');
const router = express.Router();
const { Order, Product } = require('../models');
const { isAuthenticated } = require('../middleware/auth');
const {
  validateTransition,
  getStateMetadata,
  getValidNextTransitions,
  isTerminalState
} = require('../dfa/dfaOrderValidator');

// Helper to generate unique order number
function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${rand}`;
}

// POST /api/orders/place (Requires Authentication)
router.post('/place', isAuthenticated, async (req, res, next) => {
  try {
    const user = req.session.user;
    const { shippingAddress, paymentMethod } = req.body;

    // Check cart
    const cart = req.session.cart;
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your shopping cart is empty.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({ success: false, error: 'Complete shipping address is required.' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, error: `Product "${item.name}" is no longer available.` });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ success: false, error: `Insufficient stock for "${product.name}". Available: ${product.stock}` });
      }

      const lineTotal = parseFloat((product.price * item.quantity).toFixed(2));
      subtotal += lineTotal;

      orderItems.push({
        productId: product._id || product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
        subtotal: lineTotal
      });

      // Deduct product stock
      await Product.findByIdAndUpdate(product._id || product.id, {
        stock: Math.max(0, product.stock - item.quantity)
      });
    }

    subtotal = parseFloat(subtotal.toFixed(2));
    const shippingFee = subtotal >= 50 ? 0 : 9.99;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const totalAmount = parseFloat((subtotal + shippingFee + tax).toFixed(2));

    const orderNumber = generateOrderNumber();
    const nowIso = new Date().toISOString();

    // INITIAL DFA STATE: S0 (Order Placed)
    const initialDfaState = 'S0';
    const stateMeta = getStateMetadata(initialDfaState);

    const initialHistoryEntry = {
      fromState: 'START',
      toState: 'S0',
      action: 'PLACE_ORDER',
      actionLabel: 'Order Placed',
      changedBy: `Customer (${user.name})`,
      note: 'Order successfully created and accepted in initial DFA state S0.',
      timestamp: nowIso
    };

    const newOrder = await Order.create({
      orderNumber,
      customer: {
        id: user.id || user._id,
        name: user.name,
        email: user.email
      },
      items: orderItems,
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state ? shippingAddress.state.trim() : '',
        postalCode: shippingAddress.postalCode.trim(),
        phone: shippingAddress.phone ? shippingAddress.phone.trim() : user.phone || ''
      },
      payment: {
        method: paymentMethod || 'Simulated Card',
        status: 'PAID',
        transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        last4: '4242'
      },
      currentState: initialDfaState,
      currentStateLabel: stateMeta.label,
      isTerminal: false,
      history: [initialHistoryEntry]
    });

    // Clear session cart
    req.session.cart = { items: [] };

    res.status(201).json({
      success: true,
      message: 'Order placed successfully in DFA State S0 (Order Placed)!',
      order: newOrder
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my-orders (Customer's Order History)
router.get('/my-orders', isAuthenticated, async (req, res, next) => {
  try {
    const userId = req.session.user.id || req.session.user._id;
    const orders = await Order.find({ 'customer.id': String(userId) });

    // Enrich with DFA metadata
    const enriched = orders.map(order => ({
      ...order,
      dfaMeta: getStateMetadata(order.currentState),
      validNextTransitions: getValidNextTransitions(order.currentState)
    }));

    res.json({ success: true, count: enriched.length, orders: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id (Order Details & DFA Tracking Information)
router.get('/:id', isAuthenticated, async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const userId = req.session.user.id || req.session.user._id;
    const isOwner = String(order.customer.id) === String(userId);
    const userIsAdmin = req.session.user.role === 'admin';

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this order.' });
    }

    const stateMeta = getStateMetadata(order.currentState);
    const validNextTransitions = getValidNextTransitions(order.currentState);

    res.json({
      success: true,
      order: {
        ...order,
        dfaMeta: stateMeta,
        validNextTransitions,
        canCustomerCancel: ['S0', 'S1'].includes(order.currentState)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/cancel (Customer Cancellation with DFA Validation)
router.post('/:id/cancel', isAuthenticated, async (req, res, next) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const userId = req.session.user.id || req.session.user._id;
    const isOwner = String(order.customer.id) === String(userId);
    const userIsAdmin = req.session.user.role === 'admin';

    if (!isOwner && !userIsAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this order.' });
    }

    const { reason } = req.body;

    // Strict DFA Validation: δ(currentState, CANCEL_ORDER) -> S6
    const validation = validateTransition(order.currentState, 'CANCEL_ORDER');

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errorMessage,
        currentState: order.currentState,
        currentStateLabel: order.currentStateLabel,
        reason: validation.reason
      });
    }

    // Transition is valid! Update order
    const historyEntry = {
      fromState: validation.fromState,
      toState: validation.toState,
      action: validation.action,
      actionLabel: validation.actionLabel,
      changedBy: userIsAdmin ? `Admin (${req.session.user.email})` : `Customer (${req.session.user.name})`,
      note: reason ? `Customer cancellation: ${reason}` : 'Cancelled by customer via valid DFA transition δ -> S6.',
      timestamp: new Date().toISOString()
    };

    // Restore stock for cancelled items
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const prod = await Product.findById(item.productId);
        if (prod) {
          await Product.findByIdAndUpdate(item.productId, {
            stock: (prod.stock || 0) + item.quantity
          });
        }
      }
    }

    const targetId = order._id || order.id;
    const updatedOrder = await Order.findByIdAndUpdate(
      targetId,
      {
        currentState: validation.toState,
        currentStateLabel: validation.toLabel,
        isTerminal: isTerminalState(validation.toState),
        'payment.status': 'CANCELLED',
        $push: { history: historyEntry }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Order successfully cancelled via DFA transition (${validation.fromState} -> ${validation.toState}).`,
      order: updatedOrder,
      transition: validation
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
