const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Journal = require('../models/Journal');
const SystemSettings = require('../models/SystemSettings');
const EmailLog = require('../models/EmailLog');
const ApiLog = require('../models/ApiLog');
const { protect, isAdmin } = require('../middleware/auth');
const { getDestinations, getAllPlaces, getAllCities } = require('../services/mlProxy');
const City = require('../models/City');
const Place = require('../models/Place');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Fire-and-forget webhook to tell Python ML-Service to reload its data
const refreshPythonIndex = () => {
  axios.post('http://localhost:8000/api/refresh-index/').catch(() => {});
};

const updateImageCache = (key, imagesArray) => {
  try {
    const cachePath = path.join(__dirname, '..', '..', 'ml-service', 'cache', 'image_cache.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      data[key.toLowerCase().trim()] = imagesArray;
      fs.writeFileSync(cachePath, JSON.stringify(data, null, 4), 'utf8');
    }
  } catch(e) {
    console.error("Cache update failed", e);
  }
};

const getImageUrl = (req, file) => {
  return `${req.protocol}://${req.get('host')}/uploads/locations/${req.uploadFolderName}/${file.filename}`;
};

// GET /api/admin/places (Limit to 500 for UI performance)
router.get('/places', protect, isAdmin, async (req, res) => {
  try {
    const [pythonData, mongoPlaces] = await Promise.all([
      getAllPlaces().catch(() => ({ places: [] })),
      Place.find({})
    ]);

    const mongoMap = new Map(mongoPlaces.map(p => [(p.name + '|' + p.cityName).toLowerCase(), p]));

    const mergedPlaces = (pythonData.places || []).map(p => {
      const key = (p.name + '|' + p.city).toLowerCase();
      const mongoDoc = mongoMap.get(key);
      if (mongoDoc) {
        return mongoDoc;
      } else {
        const slug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          ...p,
          cityName: p.city,
          _id: 'csv-' + slug,
          images: [],
          image: ''
        };
      }
    });

    res.json(mergedPlaces.slice(0, 500)); // Limit for UI performance
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/places
router.post('/places', protect, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const placeData = { ...req.body };
    if (req.files && req.files.length > 0) {
      placeData.images = req.files.map(file => getImageUrl(req, file));
      placeData.image = placeData.images[0]; // Set first as main
    }
    // Also need to get City ObjectId if cityName is provided but not city ID
    if (!placeData.city && placeData.cityName) {
        let c = await City.findOne({ name: new RegExp('^' + placeData.cityName + '$', 'i') });
        if (!c && placeData.state) {
          const citySlug = placeData.cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          c = new City({ name: placeData.cityName, state: placeData.state, slug: citySlug });
          await c.save();
        }
        if (c) placeData.city = c._id;
    }
    // Create slug if missing
    if (!placeData.slug) {
        placeData.slug = (placeData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    const place = new Place(placeData);
    await place.save();
    if (place.images && place.images.length > 0) {
        updateImageCache(`${place.name} ${place.cityName} india`, place.images);
    }
    refreshPythonIndex();
    res.json(place);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/admin/places/:id
router.put('/places/:id', protect, isAdmin, upload.array('images', 5), async (req, res) => {
  try {
    const placeData = { ...req.body };
    let place;

    if (req.params.id.startsWith('csv-')) {
      // It's a CSV row being promoted to MongoDB
      delete placeData._id; // Prevent Cast to ObjectId failed
      
      let oldImages = [];
      try {
        const cachePath = path.join(__dirname, '..', '..', 'ml-service', 'cache', 'image_cache.json');
        if (fs.existsSync(cachePath)) {
          const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
          const key = `${placeData.name} ${placeData.cityName || placeData.city} india`.toLowerCase().trim();
          if (data[key]) oldImages = data[key];
        }
      } catch (e) {}

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => getImageUrl(req, file));
        placeData.images = [...newImages, ...oldImages];
        placeData.image = placeData.images[0];
      } else {
        placeData.images = oldImages;
        placeData.image = oldImages[0] || '';
      }
      
      // Resolve city string to ObjectId if present
      if (placeData.cityName || (typeof placeData.city === 'string' && placeData.city.length !== 24)) {
          const cityName = placeData.cityName || placeData.city;
          let c = await City.findOne({ name: new RegExp('^' + cityName + '$', 'i') });
          
          if (!c && placeData.state) {
            const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            let existingCitySlug = await City.findOne({ slug: citySlug });
            if (!existingCitySlug) {
              c = new City({ name: cityName, state: placeData.state, slug: citySlug });
              await c.save();
            } else {
              c = existingCitySlug;
            }
          }

          if (c) placeData.city = c._id;
          else delete placeData.city; // Remove invalid ObjectId
      }
      
      placeData.slug = (placeData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let existingPlace = await Place.findOne({ slug: placeData.slug });
      if (existingPlace) {
         place = await Place.findByIdAndUpdate(existingPlace._id, placeData, { new: true });
      } else {
         place = new Place(placeData);
         await place.save();
      }
    } else {
      // Normal update
      const existingPlace = await Place.findById(req.params.id);
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => getImageUrl(req, file));
        placeData.images = [...newImages, ...(existingPlace.images || [])]; 
        placeData.image = placeData.images[0];
      }
      place = await Place.findByIdAndUpdate(req.params.id, placeData, { new: true });
    }

    updateImageCache(`${place.name} ${place.cityName} india`, place.images);
    refreshPythonIndex();
    res.json(place);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/admin/places/:id
router.delete('/places/:id', protect, isAdmin, async (req, res) => {
  try {
    await Place.findByIdAndDelete(req.params.id);
    // Note: Leaving files on disk per user request
    refreshPythonIndex();
    res.json({ success: true });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// GET /api/admin/cities
router.get('/cities', protect, isAdmin, async (req, res) => {
  try {
    const [pythonData, mongoCities] = await Promise.all([
      getAllCities().catch(() => ({ cities: [] })),
      City.find({})
    ]);

    const mongoMap = new Map(mongoCities.map(c => [(c.name + '|' + c.state).toLowerCase(), c]));

    const processedKeys = new Set();
    const mergedCities = (pythonData.cities || []).map(c => {
      const key = (c.city + '|' + c.state).toLowerCase();
      processedKeys.add(key);
      const mongoDoc = mongoMap.get(key);
      if (mongoDoc) {
        return mongoDoc;
      } else {
        const slug = (c.city || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          name: c.city,
          state: c.state,
          _id: 'csv-' + slug,
          images: [],
          image: '',
          type: 'General',
          placesCount: c.place_count,
          aiSummary: ''
        };
      }
    });

    // Include newly added cities from MongoDB that have 0 places (not in ML index yet)
    for (const [key, mongoDoc] of mongoMap.entries()) {
      if (!processedKeys.has(key)) {
        mergedCities.push(mongoDoc);
      }
    }

    res.json(mergedCities);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/cities
router.post('/cities', protect, isAdmin, upload.array('images', 2), async (req, res) => {
  try {
    const existing = await City.findOne({ 
      name: { $regex: new RegExp('^' + req.body.name + '$', 'i') } 
    });
    if (existing) return res.status(400).json({ message: 'City already exists' });

    const cityData = { ...req.body };
    cityData.slug = (cityData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (req.files && req.files.length > 0) {
      cityData.images = req.files.map(file => getImageUrl(req, file));
      cityData.image = cityData.images[0];
    }
    const city = new City(cityData);
    await city.save();
    if (city.images && city.images.length > 0) {
        updateImageCache(`${city.name} ${city.state} india tourism`, city.images);
    }
    refreshPythonIndex();
    res.json(city);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/admin/cities/:id
router.put('/cities/:id', protect, isAdmin, upload.array('images', 2), async (req, res) => {
  try {
    const cityData = { ...req.body };
    let city;

    if (req.params.id.startsWith('csv-')) {
      delete cityData._id; // Prevent Cast to ObjectId failed
      cityData.slug = (cityData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      let oldImages = [];
      try {
        const cachePath = path.join(__dirname, '..', '..', 'ml-service', 'cache', 'image_cache.json');
        if (fs.existsSync(cachePath)) {
          const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
          const key = `${cityData.name} ${cityData.state} india tourism`.toLowerCase().trim();
          if (data[key]) oldImages = data[key];
        }
      } catch (e) {}

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => getImageUrl(req, file));
        cityData.images = [...newImages, ...oldImages];
        cityData.image = cityData.images[0];
      } else {
        cityData.images = oldImages;
        cityData.image = oldImages[0] || '';
      }
      let existingCity = await City.findOne({ slug: cityData.slug });
      if (existingCity) {
        city = await City.findByIdAndUpdate(existingCity._id, cityData, { new: true });
      } else {
        city = new City(cityData);
        await city.save();
      }
    } else {
      const existingCity = await City.findById(req.params.id);
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => getImageUrl(req, file));
        cityData.images = [...newImages, ...(existingCity.images || [])];
        cityData.image = cityData.images[0];
      }
      city = await City.findByIdAndUpdate(req.params.id, cityData, { new: true });
    }

    updateImageCache(`${city.name} ${city.state} india tourism`, city.images);
    refreshPythonIndex();
    res.json(city);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/admin/cities/:id
router.delete('/cities/:id', protect, isAdmin, async (req, res) => {
  try {
    await City.findByIdAndDelete(req.params.id);
    refreshPythonIndex();
    res.json({ success: true });
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// GET /api/admin/locations/autocomplete
router.get('/locations/autocomplete', protect, isAdmin, async (req, res) => {
  try {
    const states = await City.distinct('state');
    const cities = await City.find().select('name state _id');
    res.json({ states, cities });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

const DJANGO_URL = process.env.DJANGO_ML_URL || 'http://localhost:8000/api';

// GET /api/admin/stats
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const verifiedCount = await User.countDocuments({ isVerified: true });
    const journalCount = await Journal.countDocuments();
    res.json({ userCount, verifiedCount, journalCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/destinations
router.get('/destinations', protect, isAdmin, async (req, res) => {
  try {
    const result = await getDestinations();
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/users
router.get('/users', protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password -searchHistory').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/users/:id/credits
router.put('/users/:id/credits', protect, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (req.body.maxCredits !== undefined) {
      user.maxCredits = req.body.maxCredits;
    }
    if (req.body.resetNow) {
      user.credits = user.maxCredits;
    }
    await user.save();
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/settings
router.get('/settings', protect, isAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/admin/settings
router.put('/settings', protect, isAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    settings.updatedBy = req.user._id;
    settings.updatedAt = Date.now();
    await settings.save();
    res.json(settings);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/logs/emails
router.get('/logs/emails', protect, isAdmin, async (req, res) => {
  try {
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(100);
    res.json({ logs });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/charts/:chartName
router.get('/charts/:chartName', protect, isAdmin, async (req, res) => {
  try {
    let chartName = req.params.chartName;
    const theme = req.query.theme || 'dark';
    if (chartName === 'ml-performance') chartName = 'city-comparison'; // Map old to new
    
    if (chartName === 'system-health') {
      // 1. Fetch real API log count per hour for the last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const aggResult = await ApiLog.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        { $group: {
            _id: { $hour: "$createdAt" },
            count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);
      
      // Initialize 24-hour array with 0s
      let hourlyHits = new Array(24).fill(0);
      const currentHour = new Date().getUTCHours();
      
      aggResult.forEach(item => {
        if(item._id >= 0 && item._id < 24) {
          // Map absolute UTC hour to a rolling position where currentHour is at index 23
          let pos = 23 - ((currentHour - item._id + 24) % 24);
          if (pos >= 0 && pos < 24) {
              hourlyHits[pos] = item.count;
          }
        }
      });
      
      // Send as POST to Django
      const response = await axios.post(`${DJANGO_URL}/charts/${chartName}/?theme=${theme}`, { hits: hourlyHits });
      return res.json(response.data);
    }
    
    // Default GET proxy for other charts
    const response = await axios.get(`${DJANGO_URL}/charts/${chartName}/?theme=${theme}`);
    res.json(response.data);
  } catch (err) {
    console.error(`Error fetching chart ${req.params.chartName}:`, err.response ? err.response.data : err);
    res.status(500).json({ message: `Chart ${req.params.chartName} unavailable` });
  }
});

module.exports = router;
