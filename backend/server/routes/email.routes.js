const express = require('express');
const router = express.Router();
const { sendItineraryEmail } = require('../services/emailService');

router.post('/itinerary', async (req, res) => {
  try {
    const { email, itinerary } = req.body;
    if (!email) return res.status(400).json({ message: 'Recipient email is required' });
    await sendItineraryEmail(email, itinerary || {});
    res.json({ message: 'Itinerary sent successfully!', to: email });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send email', error: err.message });
  }
});

module.exports = router;
