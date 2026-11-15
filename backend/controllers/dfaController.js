const dfaService = require('../services/dfaService');
const TransitionHistory = require('../models/TransitionHistory');

// @desc    Get complete DFA definition & transition matrix
// @route   GET /api/dfa/transitions
// @access  Public
const getDfaTransitions = (req, res) => {
  try {
    const formalTuple = {
      title: 'Order Status Validation Automaton',
      formalNotation: 'M = (Q, Σ, δ, q0, F)',
      description: 'Deterministic Finite Automaton governing valid state transitions in the order lifecycle.',
      Q: Object.values(dfaService.DFA_STATES),
      Sigma: Object.values(dfaService.DFA_ALPHABET),
      q0: dfaService.INITIAL_STATE,
      F: dfaService.FINAL_STATES,
      terminalStates: dfaService.TERMINAL_STATES,
      delta: dfaService.DFA_TRANSITIONS
    };

    res.json({
      success: true,
      data: formalTuple
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Validate arbitrary state transition against DFA
// @route   POST /api/dfa/validate
// @access  Public
const validateTransitionEndpoint = (req, res) => {
  try {
    const { currentState, inputSymbol } = req.body;

    if (!currentState || !inputSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both currentState and inputSymbol in request body.'
      });
    }

    const result = dfaService.validateTransition(currentState, inputSymbol);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Simulate sequence of input symbols on DFA
// @route   POST /api/dfa/simulate
// @access  Public
const simulateSequenceEndpoint = (req, res) => {
  try {
    const { startState = 'S0', symbols = [] } = req.body;

    if (!Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Input symbols must be an array of strings from alphabet Σ.'
      });
    }

    const result = dfaService.simulateSequence(startState, symbols);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get transition history for specific order
// @route   GET /api/dfa/history/:orderId
// @access  Private
const getOrderTransitionHistory = async (req, res) => {
  try {
    const history = await TransitionHistory.find({ orderId: req.params.orderId })
      .populate('updatedBy', 'name email role')
      .sort({ timestamp: 1 });

    res.json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all transition history (audit log)
// @route   GET /api/dfa/history
// @access  Private/Admin
const getAllTransitionHistory = async (req, res) => {
  try {
    const { limit = 100, result } = req.query;
    let query = {};
    if (result && ['ACCEPTED', 'REJECTED'].includes(result.toUpperCase())) {
      query.validationResult = result.toUpperCase();
    }

    const history = await TransitionHistory.find(query)
      .populate('orderId', 'currentStatus totalAmount')
      .populate('updatedBy', 'name email role')
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    const total = await TransitionHistory.countDocuments(query);
    const acceptedCount = await TransitionHistory.countDocuments({ validationResult: 'ACCEPTED' });
    const rejectedCount = await TransitionHistory.countDocuments({ validationResult: 'REJECTED' });

    res.json({
      success: true,
      total,
      stats: {
        acceptedCount,
        rejectedCount,
        acceptanceRate: total > 0 ? Math.round((acceptedCount / total) * 100) : 100
      },
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDfaTransitions,
  validateTransitionEndpoint,
  simulateSequenceEndpoint,
  getOrderTransitionHistory,
  getAllTransitionHistory
};
