const Order = require('../models/Order');
const Product = require('../models/Product');
const TransitionHistory = require('../models/TransitionHistory');
const dfaService = require('../services/dfaService');

// @desc    Create new order (Initial state S0 - Order Placed)
// @route   POST /api/orders
// @access  Private/Customer
const createOrder = async (req, res) => {
  try {
    const { products, deliveryAddress, paymentMethod } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be empty. Please add items to your cart.'
      });
    }

    if (!deliveryAddress || !deliveryAddress.fullName || !deliveryAddress.address || !deliveryAddress.phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full delivery address details.'
      });
    }

    // Verify stock and compute total securely on server
    let totalAmount = 0;
    const verifiedOrderItems = [];

    for (const item of products) {
      const dbProduct = await Product.findById(item.product || item._id);
      if (!dbProduct) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product || item._id} not found.`
        });
      }

      const qty = Number(item.quantity) || 1;
      if (dbProduct.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${dbProduct.name}'. Available: ${dbProduct.stock}, Requested: ${qty}`
        });
      }

      totalAmount += dbProduct.price * qty;
      verifiedOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: qty,
        image: dbProduct.image
      });

      // Deduct inventory
      dbProduct.stock -= qty;
      await dbProduct.save();
    }

    // Initial transition record: START -> S0 on input symbol 'PLACE'
    const initialTransition = {
      previousState: 'START',
      previousStateName: 'Not Placed',
      inputSymbol: 'PLACE',
      nextState: 'S0',
      nextStateName: 'Order Placed',
      validationResult: 'ACCEPTED',
      reason: 'Order successfully created. Initial DFA state set to S0 (Order Placed).',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    };

    const order = new Order({
      userId: req.user._id,
      products: verifiedOrderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod: paymentMethod || 'Simulated Card Payment (Academic Demo)',
      paymentStatus: 'Completed',
      currentStatus: {
        code: 'S0',
        name: 'Order Placed'
      },
      transitionHistory: [initialTransition]
    });

    const savedOrder = await order.save();

    // Also persist in the central TransitionHistory collection
    await TransitionHistory.create({
      orderId: savedOrder._id,
      previousState: 'START',
      previousStateName: 'Not Placed',
      inputSymbol: 'PLACE',
      nextState: 'S0',
      nextStateName: 'Order Placed',
      validationResult: 'ACCEPTED',
      reason: initialTransition.reason,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      timestamp: initialTransition.timestamp
    });

    res.status(201).json({
      success: true,
      data: savedOrder,
      message: 'Order placed successfully. Current DFA State: S0 (Order Placed).'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (Owner or Admin)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('transitionHistory.updatedBy', 'name email role');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Check authorization: customer must own the order or user must be admin
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this order.'
      });
    }

    const validTransitions = dfaService.getValidNextTransitions(order.currentStatus.code);
    const cancellable = dfaService.isCancellable(order.currentStatus.code);

    res.json({
      success: true,
      data: {
        ...order.toObject(),
        validTransitions,
        isCancellable: cancellable
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    let query = {};

    if (status && status !== 'All') {
      query['currentStatus.code'] = status;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const totalOrders = await Order.countDocuments(query);

    // Calculate high-level order metrics for admin dashboard
    const metricsAgg = await Order.aggregate([
      {
        $group: {
          _id: '$currentStatus.code',
          count: { $sum: 1 },
          totalSales: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      total: totalOrders,
      page: Number(page),
      data: orders,
      metrics: metricsAgg
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update order status via DFA validation (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { inputSymbol, note } = req.body;

    if (!inputSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an input symbol from the DFA alphabet Σ.'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    const currentStateCode = order.currentStatus.code;
    const validation = dfaService.validateTransition(currentStateCode, inputSymbol);

    // If validation fails (rejected transition)
    if (!validation.accepted) {
      // Record rejected transition attempt in audit history
      const rejectedTransition = {
        previousState: currentStateCode,
        previousStateName: dfaService.DFA_STATES[currentStateCode]?.name || currentStateCode,
        inputSymbol,
        nextState: null,
        nextStateName: null,
        validationResult: 'REJECTED',
        reason: `${validation.reason}${note ? ` (Note: ${note})` : ''}`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      };

      order.transitionHistory.push(rejectedTransition);
      await order.save();

      // Log to central TransitionHistory
      await TransitionHistory.create({
        orderId: order._id,
        previousState: currentStateCode,
        previousStateName: rejectedTransition.previousStateName,
        inputSymbol,
        nextState: null,
        nextStateName: null,
        validationResult: 'REJECTED',
        reason: rejectedTransition.reason,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedByRole: req.user.role,
        timestamp: rejectedTransition.timestamp
      });

      return res.status(400).json({
        success: false,
        validationResult: 'REJECTED',
        currentState: currentStateCode,
        inputSymbol,
        reason: validation.reason,
        message: `DFA Rejection: The transition δ(${currentStateCode}, ${inputSymbol}) is not permitted.`
      });
    }

    // Validation succeeded (accepted transition)
    const nextStateCode = validation.nextState;
    const nextStateName = validation.nextStateName;

    // If transitioning to S6 (Cancelled), restore inventory stock
    if (nextStateCode === 'S6') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    const acceptedTransition = {
      previousState: currentStateCode,
      previousStateName: dfaService.DFA_STATES[currentStateCode]?.name,
      inputSymbol,
      nextState: nextStateCode,
      nextStateName,
      validationResult: 'ACCEPTED',
      reason: `${validation.reason}${note ? ` (Note: ${note})` : ''}`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    };

    order.currentStatus = {
      code: nextStateCode,
      name: nextStateName
    };
    order.transitionHistory.push(acceptedTransition);

    const updatedOrder = await order.save();

    // Log to central TransitionHistory
    await TransitionHistory.create({
      orderId: order._id,
      previousState: currentStateCode,
      previousStateName: acceptedTransition.previousStateName,
      inputSymbol,
      nextState: nextStateCode,
      nextStateName,
      validationResult: 'ACCEPTED',
      reason: acceptedTransition.reason,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      timestamp: acceptedTransition.timestamp
    });

    res.json({
      success: true,
      validationResult: 'ACCEPTED',
      message: `DFA Acceptance: Transition δ(${currentStateCode}, ${inputSymbol}) -> ${nextStateCode} (${nextStateName}) successfully executed.`,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel order (Customer or Admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.'
      });
    }

    // Authorization: customer must own the order or user must be admin
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have authorization to cancel this order.'
      });
    }

    const currentStateCode = order.currentStatus.code;

    // Validate CANCEL transition through DFA
    const validation = dfaService.validateTransition(currentStateCode, 'CANCEL');

    if (!validation.accepted) {
      // Record rejected transition
      const rejectedTransition = {
        previousState: currentStateCode,
        previousStateName: dfaService.DFA_STATES[currentStateCode]?.name,
        inputSymbol: 'CANCEL',
        nextState: null,
        nextStateName: null,
        validationResult: 'REJECTED',
        reason: `Cancellation rejected by DFA: Orders in state ${currentStateCode} cannot be cancelled once dispatched or finished.`,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        timestamp: new Date()
      };

      order.transitionHistory.push(rejectedTransition);
      await order.save();

      await TransitionHistory.create({
        orderId: order._id,
        previousState: currentStateCode,
        previousStateName: rejectedTransition.previousStateName,
        inputSymbol: 'CANCEL',
        nextState: null,
        nextStateName: null,
        validationResult: 'REJECTED',
        reason: rejectedTransition.reason,
        updatedBy: req.user._id,
        updatedByName: req.user.name,
        updatedByRole: req.user.role,
        timestamp: rejectedTransition.timestamp
      });

      return res.status(400).json({
        success: false,
        validationResult: 'REJECTED',
        message: `Order cannot be cancelled. In current state '${currentStateCode} (${dfaService.DFA_STATES[currentStateCode]?.name})', cancellation is not permitted by DFA rules.`,
        reason: validation.reason
      });
    }

    // Transition to S6 (Cancelled)
    // Restore product stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    const nextStateCode = 'S6';
    const nextStateName = dfaService.DFA_STATES[nextStateCode].name;

    const acceptedTransition = {
      previousState: currentStateCode,
      previousStateName: dfaService.DFA_STATES[currentStateCode]?.name,
      inputSymbol: 'CANCEL',
      nextState: nextStateCode,
      nextStateName,
      validationResult: 'ACCEPTED',
      reason: `Order cancelled by ${req.user.role === 'admin' ? 'Administrator' : 'Customer'}. DFA transition δ(${currentStateCode}, CANCEL) -> S6 executed.`,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      timestamp: new Date()
    };

    order.currentStatus = {
      code: nextStateCode,
      name: nextStateName
    };
    order.transitionHistory.push(acceptedTransition);

    const updatedOrder = await order.save();

    await TransitionHistory.create({
      orderId: order._id,
      previousState: currentStateCode,
      previousStateName: acceptedTransition.previousStateName,
      inputSymbol: 'CANCEL',
      nextState: nextStateCode,
      nextStateName,
      validationResult: 'ACCEPTED',
      reason: acceptedTransition.reason,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      updatedByRole: req.user.role,
      timestamp: acceptedTransition.timestamp
    });

    res.json({
      success: true,
      validationResult: 'ACCEPTED',
      message: 'Order cancelled successfully. Stock has been restored.',
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
};
