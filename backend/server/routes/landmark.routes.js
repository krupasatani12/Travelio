const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { protect } = require('../middleware/auth');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'landmarks') });

const DJANGO_URL = process.env.DJANGO_ML_URL || 'http://localhost:8000/api';

router.post('/predict', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const settings = await SystemSettings.findOne();
    const isOffline = settings && settings.mode === 'offline';
    
    if (isOffline) {
      return res.status(400).json({ error: 'Gemini Vision is disabled in Offline mode.' });
    }

    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user && user.credits < 5) {
        return res.status(402).json({ error: 'Out of AI credits for Gemini Vision.' });
      }
      if (user) {
        user.credits -= 5;
        if (!user.creditUsage) user.creditUsage = [];
        user.creditUsage.push({ service: 'landmark', creditsUsed: 5 });
        await user.save();
      }
    }

    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);

      const djangoRes = await axios.post(`${DJANGO_URL}/landmark/predict/`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000,
      });

      return res.json(djangoRes.data);
    } catch (djangoErr) {
      const errorMsg = djangoErr.response?.data?.error || djangoErr.message || 'Gemini Vision service unavailable.';
      return res.status(500).json({ error: errorMsg });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
