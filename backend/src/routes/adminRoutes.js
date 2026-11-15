const express = require('express');
const router = express.Router();
const { Order, Product, User } = require('../models');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const {
  DFA_STATES,
  DFA_ACTIONS,
  validateTransition,
  getValidNextTransitions,
  getStateMetadata,
  isTerminalState,
  getAllStates
} = require('../dfa/dfaOrderValidator');

// Protect all admin routes
router.use(isAuthenticated, isAdmin);

// GET /api/admin/metrics
router.get('/metrics', async (req, res, next) => {
  try {
    const orders = await Order.find({});
    const products = await Product.find({});
    const customers = await User.find({ role: 'customer' });

    let totalRevenue = 0;
    const stateCounts = {
      S0: 0,
      S1: 0,
      S2: 0,
      S3: 0,
      S4: 0,
      S5: 0,
      S6: 0
    };

    orders.forEach(o => {
      if (o.currentState !== 'S6') {
        totalRevenue += o.totalAmount || 0;
      }
      if (stateCounts[o.currentState] !== undefined) {
        stateCounts[o.currentState]++;
      }
    });

    const activeOrders = stateCounts.S0 + stateCounts.S1 + stateCounts.S2 + stateCounts.S3 + stateCounts.S4;
    const deliveredOrders = stateCounts.S5;
    const cancelledOrders = stateCounts.S6;

    res.json({
      success: true,
      metrics: {
        totalOrders: orders.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        activeOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts: products.length,
        totalCustomers: customers.length,
        stateCounts,
        dfaStates: getAllStates()
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders (List all orders with optional filter by state)
router.get('/orders', async (req, res, next) => {
  try {
    const { state, search } = req.query;
    let orders = await Order.find({});

    if (state && state !== 'ALL') {
      orders = orders.filter(o => o.currentState === state);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customer && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer && o.customer.email.toLowerCase().includes(q))
      );
    }

    const enriched = orders.map(o => ({
      ...o,
      dfaMeta: getStateMetadata(o.currentState),
      validNextTransitions: getValidNextTransitions(o.currentState),
      isTerminal: isTerminalState(o.currentState)
    }));

    res.json({
      success: true,
      count: enriched.length,
      orders: enriched
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/:id/transition (DFA STATUS TRANSITION VALIDATION & UPDATE)
router.post('/orders/:id/transition', async (req, res, next) => {
  try {
    const { targetState, action, note } = req.body;
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const targetInput = targetState || action;
    if (!targetInput) {
      return res.status(400).json({
        success: false,
        error: 'Target state or action is required for DFA transition.'
      });
    }

    // MANDATORY DFA VALIDATION: δ(currentState, input) -> nextState
    const validation = validateTransition(order.currentState, targetInput);

    // If DFA validation fails, REJECT with error message
    if (!validation.isValid) {
      console.warn(`[DFA Violation] Order ${order.orderNumber} rejected transition from ${order.currentState} to ${targetInput}: ${validation.errorMessage}`);
      return res.status(400).json({
        success: false,
        isDfaViolation: true,
        error: validation.errorMessage,
        currentState: order.currentState,
        currentStateLabel: order.currentStateLabel,
        targetRequested: targetInput,
        reason: validation.reason,
        allowedNextTransitions: getValidNextTransitions(order.currentState)
      });
    }

    // DFA Transition is VALID! Commit to database
    const adminUser = req.session.user;
    const historyEntry = {
      fromState: validation.fromState,
      toState: validation.toState,
      action: validation.action,
      actionLabel: validation.actionLabel,
      changedBy: `Admin (${adminUser.name} <${adminUser.email}>)`,
      note: note ? note.trim() : `DFA Transition δ(${validation.fromState}, ${validation.action}) -> ${validation.toState} executed by Admin.`,
      timestamp: new Date().toISOString()
    };

    // If transitioned to Cancelled (S6), restore inventory
    if (validation.toState === 'S6' && Array.isArray(order.items)) {
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
        $push: { history: historyEntry }
      },
      { new: true }
    );

    console.log(`[DFA Approved] Order ${order.orderNumber}: ${validation.fromState} -> ${validation.toState} (${validation.actionLabel})`);

    res.json({
      success: true,
      message: `DFA Transition Approved: Order transitioned from '${validation.fromLabel}' (${validation.fromState}) to '${validation.toLabel}' (${validation.toState}).`,
      order: updatedOrder,
      transition: validation,
      validNextTransitions: getValidNextTransitions(validation.toState),
      isTerminal: isTerminalState(validation.toState)
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/orders/:id/test-rejection (Deliberate DFA Rejection Demonstration)
router.post('/orders/:id/test-rejection', async (req, res, next) => {
  try {
    const { invalidTarget } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    // Run transition through DFA validator without saving
    const validation = validateTransition(order.currentState, invalidTarget || 'S5');

    res.json({
      success: true,
      testOutcome: validation.isValid ? 'ACCEPTED' : 'REJECTED_AS_EXPECTED',
      validation,
      explanation: validation.isValid
        ? 'Transition was surprisingly valid according to the DFA rules.'
        : `DFA correctly intercepted and blocked the illegal transition attempt: "${validation.errorMessage}"`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
