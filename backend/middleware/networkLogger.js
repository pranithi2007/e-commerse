const NetworkLog = require('../models/NetworkLog');

// In-memory circular buffer for fast dashboard telemetry
const recentLogsBuffer = [];
const MAX_BUFFER_SIZE = 200;

const networkLogger = (req, res, next) => {
  const startTime = process.hrtime();
  const requestTimestamp = new Date();

  // Ignore static assets or favicon if any, but log all API calls
  res.on('finish', async () => {
    try {
      const diff = process.hrtime(startTime);
      const responseTimeMs = Math.round((diff[0] * 1e3 + diff[1] * 1e-6) * 100) / 100;

      const statusCode = res.statusCode;
      let status = 'SUCCESS';
      if (statusCode >= 400 && statusCode < 500) {
        status = 'CLIENT_ERROR';
      } else if (statusCode >= 500) {
        status = 'SERVER_ERROR';
      }

      const ip =
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const userAgent = req.headers['user-agent'] || 'Unknown Client';
      const protocol = req.protocol ? req.protocol.toUpperCase() : 'HTTP/1.1';
      const contentLength = parseInt(res.get('Content-Length') || '0', 10);

      const logEntry = {
        method: req.method,
        endpoint: req.originalUrl || req.url,
        statusCode,
        responseTime: responseTimeMs,
        ip: ip.replace('::ffff:', ''),
        userAgent,
        protocol,
        contentLength,
        status,
        timestamp: requestTimestamp
      };

      // Add to in-memory buffer
      recentLogsBuffer.unshift(logEntry);
      if (recentLogsBuffer.length > MAX_BUFFER_SIZE) {
        recentLogsBuffer.pop();
      }

      // Persist to MongoDB asynchronously (do not block client response)
      NetworkLog.create(logEntry).catch((err) => {
        // Silently log or ignore DB network log error to avoid cascade
        console.error('[NetworkLogger DB Error]:', err.message);
      });
    } catch (err) {
      console.error('[NetworkLogger Middleware Error]:', err.message);
    }
  });

  next();
};

const getRecentMemoryLogs = () => recentLogsBuffer;

module.exports = { networkLogger, getRecentMemoryLogs };
