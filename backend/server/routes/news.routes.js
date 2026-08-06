const express = require('express');
const { getNewsAlerts } = require('../services/mlProxy');
const router = express.Router();

router.get('/alerts', async (req, res) => {
  try {
    const destinations = req.query.destinations || '';
    const result = await getNewsAlerts(destinations);
    // Broadcast via WebSocket if available
    if (req.io && result.articles && result.articles.length > 0) {
      req.io.emit('news_alert', {
        title: '📰 Travel News Update',
        article: result.articles[0],
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'News service unavailable', error: err.message });
  }
});

module.exports = router;
