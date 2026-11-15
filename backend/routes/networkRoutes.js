const express = require('express');
const router = express.Router();
const {
  getNetworkLogs,
  getNetworkStatus
} = require('../controllers/networkController');

router.get('/logs', getNetworkLogs);
router.get('/status', getNetworkStatus);

module.exports = router;
