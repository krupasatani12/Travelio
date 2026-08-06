const express = require('express');
const { getRecommendations, getSeasonalData } = require('../services/mlProxy');
const { sendItineraryEmail } = require('../services/emailService');
const { protect } = require('../middleware/auth');
const { requireCredits } = require('../middleware/creditMiddleware');

const router = express.Router();
const Trip = require('../models/Trip');

// GET /api/trips — fetch user's confirmed trips
router.get('/', protect, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips/recommend
router.post('/recommend', protect, requireCredits(2, 'trip_recommend'), async (req, res) => {
  try {
    const result = await getRecommendations(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'ML service unavailable', error: err.message });
  }
});

// POST /api/trips/semantic
router.post('/semantic', protect, requireCredits(1, 'trip_semantic'), async (req, res) => {
  try {
    const { getSemanticSearch } = require('../services/mlProxy');
    const result = await getSemanticSearch(req.body.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Semantic search service unavailable', error: err.message });
  }
});

// GET /api/trips/seasonal?destination=Manali&month=7
router.get('/seasonal', async (req, res) => {
  try {
    const { destination, month } = req.query;
    if (!destination) return res.status(400).json({ message: 'destination is required' });
    const result = await getSeasonalData(destination, month || 1);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Seasonal data unavailable', error: err.message });
  }
});

// POST /api/trips/confirm — saves trip to DB + sends email
router.post('/confirm', protect, async (req, res) => {
  try {
    const { emails, itinerary, destination, state, travelMonth, groupSize,
            comfortLevel, durationDays, estimatedBudget } = req.body;

    // Save trip to MongoDB for verified badge system
    const Trip = require('../models/Trip');
    let savedTrip = null;
    if (destination) {
      savedTrip = await Trip.create({
        userId: req.user._id,
        destination: destination || (itinerary?.destination) || '',
        state: state || '',
        travelMonth: travelMonth || '',
        groupSize: parseInt(groupSize) || 1,
        comfortLevel: comfortLevel || 'mid',
        durationDays: parseInt(durationDays) || 3,
        estimatedBudget: parseInt(estimatedBudget) || 0,
        status: 'confirmed',
        itinerary: itinerary || {},
      });
    }

    if (emails && Array.isArray(emails) && itinerary) {
      // Merge outer fields into itinerary so emailService can use them
      const fullItinerary = {
        ...itinerary,
        travelMonth: travelMonth || itinerary.travelMonth,
        groupSize: parseInt(groupSize) || itinerary.groupSize,
        comfortLevel: comfortLevel || itinerary.comfortLevel,
        estimatedBudget: parseInt(estimatedBudget) || itinerary.estimatedBudget,
      };
      
      for (const email of emails) {
        if (!email.trim()) continue;
        try { await sendItineraryEmail(email.trim(), fullItinerary); } catch (e) {
          console.log(`[Email] Itinerary send failed for ${email}:`, e.message);
        }
      }
    }
    res.json({
      message: 'Trip confirmed! Itinerary email sent.',
      itinerary,
      tripId: savedTrip?._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/trips/generate-itinerary
router.post('/generate-itinerary', protect, requireCredits(10, 'full_itinerary'), async (req, res) => {
  try {
    const { city, days, budget, vibes, selectedPlaces } = req.body;
    if (!city || !days) return res.status(400).json({ message: 'city and days are required' });
    const { generateItinerary } = require('../services/mistralService');
    const result = await generateItinerary(city, days, budget, vibes || [], selectedPlaces || []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate itinerary', error: err.message });
  }
});

// POST /api/trips/extend-itinerary
router.post('/extend-itinerary', protect, requireCredits(10, 'extend_itinerary'), async (req, res) => {
  try {
    const { city, existingItinerary, extraDays, extraBudget, vibes } = req.body;
    if (!city || !existingItinerary || !extraDays) return res.status(400).json({ message: 'city, existingItinerary, and extraDays are required' });
    const { extendItinerary } = require('../services/mistralService');
    const result = await extendItinerary(city, existingItinerary, extraDays, extraBudget, vibes || []);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to extend itinerary', error: err.message });
  }
});

module.exports = router;
