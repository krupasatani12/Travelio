const express = require('express');
const { getBudgetPrediction } = require('../services/mlProxy');
const router = express.Router();

router.post('/predict', async (req, res) => {
  try {
    const result = await getBudgetPrediction(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Budget prediction service unavailable', error: err.message });
  }
});

router.post('/package-predict', async (req, res) => {
  try {
    const { getPackageBudgetPrediction } = require('../services/mlProxy');
    const result = await getPackageBudgetPrediction(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Package Budget service unavailable', error: err.message });
  }
});

module.exports = router;
