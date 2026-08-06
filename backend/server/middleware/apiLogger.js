const ApiLog = require('../models/ApiLog');

const apiLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - start;
      const log = new ApiLog({
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip,
        userId: req.user ? req.user._id : null
      });
      // We don't await this to avoid blocking the response loop
      log.save().catch(err => console.error('[ApiLogger] Save error:', err.message));
    } catch (e) {
      console.error('[ApiLogger] Error:', e.message);
    }
  });

  next();
};

module.exports = apiLogger;
