const express = require('express');
const { getRoute } = require('../services/mlProxy');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { source, destination, optimize, mode } = req.query;
    if (!source || !destination) {
      return res.status(400).json({ message: 'Source and destination are required' });
    }
    const result = await getRoute(source, destination, optimize || 'price', mode);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Route planning service unavailable', error: err.message });
  }
});

module.exports = router;
