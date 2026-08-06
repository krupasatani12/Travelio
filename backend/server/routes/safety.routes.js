const express = require('express');
const { getSafetyScore } = require('../services/mlProxy');
const router = express.Router();

router.get('/:city', async (req, res) => {
  try {
    const result = await getSafetyScore(req.params.city);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Safety scoring service unavailable', error: err.message });
  }
});

module.exports = router;
