const express = require('express');
const User = require('../models/User');
const City = require('../models/City');
const Place = require('../models/Place');
const { protect } = require('../middleware/auth');
const router = express.Router();

// POST /api/favorites/save — save a destination (city or place)
router.post('/save', protect, async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    const user = await User.findById(req.user._id);
    if (!user.savedDestinations.includes(destination)) {
      user.savedDestinations.push(destination);
      await user.save();
    }
    res.json({ savedDestinations: user.savedDestinations });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/favorites/remove — remove a destination
router.delete('/remove', protect, async (req, res) => {
  try {
    const { destination } = req.body;
    const user = await User.findById(req.user._id);
    user.savedDestinations = user.savedDestinations.filter(d => d !== destination);
    await user.save();
    res.json({ savedDestinations: user.savedDestinations });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/favorites — list all saved destinations
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ savedDestinations: user.savedDestinations || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/favorites/details — list all saved destinations with their details (type, citySlug, placeSlug)
router.get('/details', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const names = user.savedDestinations || [];
    
    // Find all matching cities and places
    const [cities, places] = await Promise.all([
      City.find({ name: { $in: names } }),
      Place.find({ name: { $in: names } })
    ]);
    
    // Build map for quick lookup
    const detailsMap = {};
    cities.forEach(c => {
      detailsMap[c.name] = { name: c.name, type: 'city', url: `/places/${c.slug}` };
    });
    places.forEach(p => {
      // Slug logic from frontend
      const citySlug = p.cityName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const placeSlug = p.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      detailsMap[p.name] = { name: p.name, type: 'place', url: `/places/${citySlug}/${placeSlug}` };
    });
    
    // Return ordered list mapped to the details
    const resolved = names.map(name => {
      if (detailsMap[name]) return detailsMap[name];
      // Fallback if not found in MongoDB
      const fallbackSlug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      return { name, type: 'unknown', url: `/places/${fallbackSlug}` };
    });
    
    res.json({ savedDestinations: resolved });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/favorites/toggle — toggle a destination (add if not saved, remove if saved)
router.post('/toggle', protect, async (req, res) => {
  try {
    const { destination } = req.body;
    if (!destination) return res.status(400).json({ message: 'Destination is required' });
    const user = await User.findById(req.user._id);
    const index = user.savedDestinations.indexOf(destination);
    if (index > -1) {
      user.savedDestinations.splice(index, 1);
    } else {
      user.savedDestinations.push(destination);
    }
    await user.save();
    res.json({
      savedDestinations: user.savedDestinations,
      isSaved: index === -1, // true if we just added it
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
