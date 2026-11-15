const NetworkLog = require('../models/NetworkLog');
const { getRecentMemoryLogs } = require('../middleware/networkLogger');
const os = require('os');

// @desc    Get network traffic logs (Database + Memory Fallback)
// @route   GET /api/network/logs
// @access  Public (or Private)
const getNetworkLogs = async (req, res) => {
  try {
    const { limit = 50, page = 1, method, status, statusCode } = req.query;
    let query = {};

    if (method && method !== 'ALL') {
      query.method = method.toUpperCase();
    }
    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }
    if (statusCode) {
      query.statusCode = Number(statusCode);
    }

    const logs = await NetworkLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const totalLogs = await NetworkLog.countDocuments(query);

    res.json({
      success: true,
      total: totalLogs,
      page: Number(page),
      data: logs
    });
  } catch (error) {
    // If DB fails, fallback to in-memory logs
    const memoryLogs = getRecentMemoryLogs();
    res.json({
      success: true,
      total: memoryLogs.length,
      page: 1,
      data: memoryLogs.slice(0, 50)
    });
  }
};

// @desc    Get real-time network telemetry and server status
// @route   GET /api/network/status
// @access  Public
const getNetworkStatus = async (req, res) => {
  try {
    const totalRequests = await NetworkLog.countDocuments();
    const successRequests = await NetworkLog.countDocuments({ status: 'SUCCESS' });
    const clientErrors = await NetworkLog.countDocuments({ status: 'CLIENT_ERROR' });
    const serverErrors = await NetworkLog.countDocuments({ status: 'SERVER_ERROR' });

    // Aggregate average latency and endpoint metrics
    const latencyAgg = await NetworkLog.aggregate([
      {
        $group: {
          _id: null,
          avgLatency: { $avg: '$responseTime' },
          minLatency: { $min: '$responseTime' },
          maxLatency: { $max: '$responseTime' }
        }
      }
    ]);

    // Top endpoints
    const endpointAgg = await NetworkLog.aggregate([
      {
        $group: {
          _id: '$endpoint',
          count: { $sum: 1 },
          avgLatency: { $avg: '$responseTime' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);

    // Status code distribution
    const statusCodesAgg = await NetworkLog.aggregate([
      {
        $group: {
          _id: '$statusCode',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent 20 logs for latency sparkline/graph
    const recentLogs = await NetworkLog.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .select('endpoint statusCode responseTime timestamp method');

    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      metrics: {
        totalRequests,
        successRequests,
        clientErrors,
        serverErrors,
        successRate: totalRequests > 0 ? Math.round((successRequests / totalRequests) * 1000) / 10 : 100,
        averageLatencyMs: latencyAgg.length > 0 ? Math.round(latencyAgg[0].avgLatency * 10) / 10 : 0,
        minLatencyMs: latencyAgg.length > 0 ? Math.round(latencyAgg[0].minLatency * 10) / 10 : 0,
        maxLatencyMs: latencyAgg.length > 0 ? Math.round(latencyAgg[0].maxLatency * 10) / 10 : 0,
        uptimeSeconds: Math.round(process.uptime()),
        topEndpoints: endpointAgg,
        statusCodes: statusCodesAgg,
        recentLatencyTrace: recentLogs.reverse(),
        system: {
          platform: os.platform(),
          architecture: os.arch(),
          cpus: os.cpus().length,
          freeMemMb: Math.round(os.freemem() / (1024 * 1024)),
          totalMemMb: Math.round(os.totalmem() / (1024 * 1024)),
          nodeVersion: process.version,
          processMemoryRssMb: Math.round(memUsage.rss / (1024 * 1024)),
          processHeapUsedMb: Math.round(memUsage.heapUsed / (1024 * 1024))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getNetworkLogs,
  getNetworkStatus
};
