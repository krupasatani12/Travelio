const express = require('express');
const { chat } = require('../services/mistralService');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { requireCredits } = require('../middleware/creditMiddleware');
const router = express.Router();

router.post('/message', protect, requireCredits(3, 'chatbot'), async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    let enrichedContext = { ...context };
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          enrichedContext.favorites = user.savedDestinations || [];
          enrichedContext.preferences = user.preferences || {};
        }
      } catch { /* proceed without user context */ }
    }

    const reply = await chat(message, enrichedContext);
    res.json({ reply, context: enrichedContext });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get response from TravelBot', details: error.message });
  }
});

module.exports = router;
