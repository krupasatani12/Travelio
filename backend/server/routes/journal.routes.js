const express = require('express');
const multer = require('multer');
const path = require('path');
const Journal = require('../models/Journal');
const Trip = require('../models/Trip');
const TripActual = require('../models/TripActual');
const { protect } = require('../middleware/auth');
const mlProxy = require('../services/mlProxy'); // For autocomplete

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '..', 'uploads', 'journals'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for video support
});

// GET all journals for user — with TripAdvisor-style sorting
router.get('/', protect, async (req, res) => {
  try {
    const { sort = 'recent', dest, location } = req.query;
    const filter = { userId: req.user._id };

    if (dest || location) {
      filter.location = { $regex: dest || location, $options: 'i' };
    }

    let journals;
    if (sort === 'relevance') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      journals = await Journal.aggregate([
        { $match: filter },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                { $cond: [{ $eq: ['$isVerifiedTrip', true] }, 10, 0] },
                { $ifNull: ['$likes', 0] },
                { $cond: [{ $gte: ['$createdAt', sevenDaysAgo] }, 5, 0] },
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
      ]);
    } else if (sort === 'rating') {
      journals = await Journal.find(filter).sort({ rating: -1, createdAt: -1 });
    } else if (sort === 'budget') {
      journals = await Journal.find(filter).sort({ actualSpendPerDay: 1, createdAt: -1 });
    } else {
      journals = await Journal.find(filter).sort({ createdAt: -1 });
    }

    res.json({ journals });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET public journals (Phase 3)
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const journals = await Journal.find({ visibility: 'public' })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Journal.countDocuments({ visibility: 'public' });

    res.json({ journals, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET public journals for a specific place (Phase 3)
router.get('/place/:placeName', async (req, res) => {
  try {
    const journals = await Journal.find({ 
      visibility: 'public',
      location: { $regex: req.params.placeName, $options: 'i' }
    })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json({ journals });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET destination autocomplete (Phase 3)
router.get('/destinations/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ results: [] });
    
    // Use mlProxy to hit CityIndex autocomplete
    const results = await mlProxy.autocompletePlaces(q);
    res.json({ results });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create journal entry
router.post('/', protect, upload.array('media', 5), async (req, res) => {
  try {
    // Process media files
    const media = (req.files || []).map(f => {
      const isVideo = f.mimetype.startsWith('video');
      return {
        type: isVideo ? 'video' : 'image',
        url: `/uploads/journals/${f.filename}`
      };
    });

    const body = req.body;
    const location = body.location || '';

    let isVerifiedTrip = false;
    let tripRef = null;
    if (location) {
      const confirmedTrip = await Trip.findOne({
        userId: req.user._id,
        destination: { $regex: location, $options: 'i' },
        status: { $in: ['confirmed', 'completed'] },
      });
      if (confirmedTrip) {
        isVerifiedTrip = true;
        tripRef = confirmedTrip._id;
      }
    }

    const journal = await Journal.create({
      ...body,
      userId: req.user._id,
      media: media.length > 0 ? media : body.media || [],
      visibility: body.visibility || 'private',
      isVerifiedTrip,
      tripRef,
      ratingValueForMoney: parseInt(body.ratingValueForMoney) || 0,
      ratingCrowds:        parseInt(body.ratingCrowds) || 0,
      ratingCleanliness:   parseInt(body.ratingCleanliness) || 0,
      ratingSafetyFelt:    parseInt(body.ratingSafetyFelt) || 0,
      ratingWouldReturn:   body.ratingWouldReturn === 'true' || body.ratingWouldReturn === true || null,
      actualSpendPerDay:   parseInt(body.actualSpendPerDay) || 0,
      actualDaysStayed:    parseInt(body.actualDaysStayed) || 0,
      rating:              parseInt(body.rating) || 0,
    });

    const actualSpend = parseInt(body.actualSpendPerDay) || 0;
    const daysStayed = parseInt(body.actualDaysStayed) || 0;
    if (actualSpend > 0 && daysStayed > 0 && isVerifiedTrip) {
      try {
        const matchedTrip = await Trip.findById(tripRef);
        await TripActual.create({
          user:               req.user._id,
          destination:        location,
          month:              matchedTrip?.travelMonth || '',
          group_size:         matchedTrip?.groupSize || 1,
          comfort_level:      matchedTrip?.comfortLevel || 'mid',
          planned_budget:     matchedTrip?.estimatedBudget || 0,
          actual_spend_total: actualSpend * daysStayed,
          days_stayed:        daysStayed,
          rating_value_for_money: parseInt(body.ratingValueForMoney) || 0,
        });
      } catch (e) {
        console.log('[TripActual] Auto-create failed:', e.message);
      }
    }

    res.status(201).json({ journal });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST comment on a journal (Phase 3)
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    journal.comments.push({ userId: req.user._id, text });
    await journal.save();

    res.json({ message: 'Comment added', comments: journal.comments });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST save/unsave a journal (Phase 3)
router.post('/:id/save', protect, async (req, res) => {
  try {
    const journal = await Journal.findById(req.params.id);
    if (!journal) return res.status(404).json({ message: 'Journal not found' });

    const isSaved = journal.savedBy.includes(req.user._id);
    if (isSaved) {
      journal.savedBy = journal.savedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      journal.savedBy.push(req.user._id);
    }
    await journal.save();

    res.json({ message: isSaved ? 'Unsaved' : 'Saved', isSaved: !isSaved });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update journal
router.put('/:id', protect, async (req, res) => {
  try {
    const journal = await Journal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, req.body, { new: true }
    );
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.json({ journal });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE journal
router.delete('/:id', protect, async (req, res) => {
  try {
    const journal = await Journal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!journal) return res.status(404).json({ message: 'Journal not found' });
    res.json({ message: 'Journal deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
