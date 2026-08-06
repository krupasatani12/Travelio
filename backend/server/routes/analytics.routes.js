const express = require('express');
const TripActual = require('../models/TripActual');
const { protect, isAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/analytics/accuracy — how accurate is the budget forecaster
router.get('/accuracy', protect, isAdmin, async (req, res) => {
  try {
    const actuals = await TripActual.find({
      forecast_error: { $exists: true },
      planned_budget: { $gt: 0 },
    });

    if (!actuals.length) return res.json({ message: 'No actuals data yet', total_actuals: 0 });

    const mae = actuals.reduce((sum, a) =>
      sum + Math.abs(a.forecast_error), 0) / actuals.length;

    const avgPlanned = actuals.reduce((s, a) => s + a.planned_budget, 0) / actuals.length;

    const byDest = {};
    actuals.forEach(a => {
      if (!byDest[a.destination]) byDest[a.destination] = [];
      byDest[a.destination].push(a.forecast_error);
    });

    res.json({
      total_actuals:   actuals.length,
      mae_rupees:      Math.round(mae),
      model_error_pct: avgPlanned > 0 ? ((mae / avgPlanned) * 100).toFixed(1) + '%' : 'N/A',
      by_destination:  Object.fromEntries(
        Object.entries(byDest).map(([k, errs]) => [k, {
          count: errs.length,
          avg_error: Math.round(errs.reduce((a, b) => a + b, 0) / errs.length),
        }])
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/seasonal-actuals?dest=Manali — real spend data by month
router.get('/seasonal-actuals', async (req, res) => {
  try {
    const { dest } = req.query;
    const matchStage = dest
      ? { $match: { destination: { $regex: dest, $options: 'i' } } }
      : { $match: {} };

    const result = await TripActual.aggregate([
      matchStage,
      {
        $group: {
          _id: { destination: '$destination', month: '$month' },
          avg_actual_per_day: { $avg: { $divide: ['$actual_spend_total', '$days_stayed'] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.destination': 1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
