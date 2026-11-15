const express = require('express');
const router = express.Router();
const {
  getDfaTransitions,
  validateTransitionEndpoint,
  simulateSequenceEndpoint,
  getOrderTransitionHistory,
  getAllTransitionHistory
} = require('../controllers/dfaController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/transitions', getDfaTransitions);
router.post('/validate', validateTransitionEndpoint);
router.post('/simulate', simulateSequenceEndpoint);
router.get('/history/:orderId', protect, getOrderTransitionHistory);
router.get('/history', protect, admin, getAllTransitionHistory);

module.exports = router;
