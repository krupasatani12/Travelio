const express = require('express');
const Location = require('../models/Location');
const Place = require('../models/Place');
const City = require('../models/City');
const { getCities, getCityPlaces, getCityDetail, getCityNearby, getPlaceDetail, getPlacesAutocomplete, getSearch } = require('../services/mlProxy');
const router = express.Router();

// GET /api/locations/internal/places-export — internal endpoint for Python ML-service to generate live charts
router.get('/internal/places-export', async (req, res) => {
  try {
    const places = await Place.find({}, 'cityName name state type rating entrance_fee review_count_lakhs latitude longitude best_time teaser image images');
    res.json(places);
  } catch (err) {
    res.status(500).json({ message: 'Internal export failed', error: err.message });
  }
});

// GET /api/locations/internal/cities-export — internal endpoint for Python ML-service
router.get('/internal/cities-export', async (req, res) => {
  try {
    const cities = await City.find({}, 'name state image images');
    res.json(cities);
  } catch (err) {
    res.status(500).json({ message: 'Internal export failed', error: err.message });
  }
});

// GET /api/locations/cities — paginated city grid
router.get('/cities', async (req, res) => {
  try {
    const result = await getCities(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'City index unavailable', error: err.message });
  }
});

// GET /api/locations/cities/:city/places — places within a city
router.get('/cities/:city/places', async (req, res) => {
  try {
    const rawCity = req.params.city || '';
    const decodedCity = decodeURIComponent(rawCity).trim();
    // Normalize city: convert hyphens to spaces if slug format (e.g. "ahmedabad" -> "ahmedabad", "new-delhi" -> "new delhi")
    const normalizedCity = decodedCity.replace(/-/g, ' ').trim();

    console.log(`\n=================== CITY LOOKUP LOG ===================`);
    console.log(`[Backend Lookup] Requested city: "${rawCity}"`);
    console.log(`[Backend Lookup] Decoded & Normalized city: "${normalizedCity}"`);

    const escapedCity = normalizedCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = new RegExp(`^\\s*${escapedCity}\\s*$`, 'i');
    const containsRegex = new RegExp(escapedCity, 'i');

    // 1. Check City collection first by name or slug to get City ObjectId if present
    let cityDoc = await City.findOne({
      $or: [
        { name: exactRegex },
        { slug: exactRegex },
        { name: containsRegex },
        { slug: containsRegex }
      ]
    }).lean();

    // 2. Build MongoDB Place query conditions without risking CastError on ObjectId field
    const placeConditions = [
      { cityName: exactRegex },
      { cityName: containsRegex }
    ];

    if (cityDoc && cityDoc._id) {
      placeConditions.push({ city: cityDoc._id });
    }

    const mongoQuery = { $or: placeConditions };
    console.log(`[Backend Lookup] MongoDB Query: ${JSON.stringify(mongoQuery)}`);

    let mongoPlaces = await Place.find(mongoQuery).lean();
    console.log(`[Backend Lookup] Number of places found in MongoDB: ${mongoPlaces ? mongoPlaces.length : 0}`);

    if (mongoPlaces && mongoPlaces.length > 0) {
      console.log(`[Backend Lookup] Places found: ${mongoPlaces.map(p => p.name).join(', ')}`);
    }

    let result = { places: [], total: 0 };

    // 3. Fetch from Python ML proxy as secondary/complementary source
    try {
      result = await getCityPlaces(normalizedCity, req.query);
      console.log(`[Backend Lookup] ML proxy returned ${result && result.places ? result.places.length : 0} place(s).`);
    } catch (mlErr) {
      console.warn(`[Backend Lookup] ML proxy fetch skipped/failed: ${mlErr.message}`);
    }

    const placesMap = new Map();

    // Add ML places first
    if (result && Array.isArray(result.places)) {
      result.places.forEach(p => {
        if (p && p.name) {
          placesMap.set(p.name.toLowerCase().trim(), p);
        }
      });
    }

    // Add/enrich with MongoDB Places
    if (mongoPlaces && mongoPlaces.length > 0) {
      mongoPlaces.forEach(p => {
        const key = p.name.toLowerCase().trim();
        if (!placesMap.has(key)) {
          placesMap.set(key, {
            name: p.name,
            city: p.cityName || cityDoc?.name || normalizedCity,
            state: p.state || cityDoc?.state || '',
            type: p.type || 'Attraction',
            rating: p.rating || 4.2,
            entrance_fee: p.entrance_fee || 0,
            image: p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
            teaser: p.teaser || ''
          });
        }
      });
    }

    const combinedPlaces = Array.from(placesMap.values());
    console.log(`[Backend Lookup] Final combined response sent to frontend: ${combinedPlaces.length} total place(s).\n=======================================================\n`);

    res.json({
      places: combinedPlaces,
      total: combinedPlaces.length,
      city: normalizedCity
    });
  } catch (err) {
    console.error(`[Backend Lookup Error]`, err);
    res.status(500).json({ message: 'City places unavailable', error: err.message });
  }
});

// GET /api/locations/cities/:citySlug/detail — city detail for dedicated page
router.get('/cities/:citySlug/detail', async (req, res) => {
  try {
    const result = await getCityDetail(req.params.citySlug);
    res.json(result);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'City not found' });
    }
    res.status(500).json({ message: 'City detail unavailable', error: err.message });
  }
});

// GET /api/locations/cities/:citySlug/nearby — nearby cities
router.get('/cities/:citySlug/nearby', async (req, res) => {
  try {
    const result = await getCityNearby(req.params.citySlug, req.query.limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Nearby cities unavailable', error: err.message });
  }
});

// GET /api/locations/cities/:citySlug/places/:placeSlug/detail — single place detail
router.get('/cities/:citySlug/places/:placeSlug/detail', async (req, res) => {
  try {
    const result = await getPlaceDetail(req.params.citySlug, req.params.placeSlug);
    res.json(result);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ message: 'Place not found' });
    }
    res.status(500).json({ message: 'Place detail unavailable', error: err.message });
  }
});

// GET /api/locations/cities/:citySlug/summary — AI Summary without burning credits
router.get('/cities/:citySlug/summary', async (req, res) => {
  try {
    const City = require('../models/City');
    const { chat } = require('../services/mistralService');
    
    // Find city in our DB (seeded by ml-service or created dynamically)
    let cityDoc = await City.findOne({ slug: req.params.citySlug });
    if (cityDoc && cityDoc.aiSummary) {
      return res.json({ reply: cityDoc.aiSummary });
    }

    // Generate free summary via Mistral (no credit deduction)
    const name = cityDoc ? cityDoc.name : req.params.citySlug.replace(/-/g, ' ');
    const prompt = `Write a short, engaging 2-sentence travel description for ${name}, highlighting its best features.`;
    const reply = await chat(prompt, { currentSubject: name });
    
    // Cache it if it's a known city in DB
    if (cityDoc) {
      cityDoc.aiSummary = reply;
      await cityDoc.save();
    }

    res.json({ reply });
  } catch (err) {
    console.error('Failed to generate free summary', err);
    res.json({ reply: 'A beautiful city to explore.' });
  }
});

// GET /api/locations/places/autocomplete — place name autocomplete
router.get('/places/autocomplete', async (req, res) => {
  try {
    const result = await getPlacesAutocomplete(req.query.q, req.query.limit);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Autocomplete unavailable', error: err.message });
  }
});

// GET /api/locations/search — Full-text search
router.get('/search', async (req, res) => {
  try {
    const result = await getSearch(req.query.q);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Search unavailable', error: err.message });
  }
});

// GET /api/locations/:id — single location by ID (existing)
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findOne({ locationId: req.params.id });
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
