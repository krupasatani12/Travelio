const express = require('express');
const router = express.Router();
const Flight = require('../models/Flight');

// Search flights
router.get('/search', async (req, res) => {
  try {
    const { source, destination, date } = req.query;

    if (!source || !destination) {
      return res.status(400).json({ message: 'Source and destination are required' });
    }

    const query = {
      source: source.toLowerCase(),
      destination: destination.toLowerCase()
    };

    if (date) {
      // Find flights on that specific date
      const searchDate = new Date(date);
      const nextDate = new Date(searchDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      query.date_of_journey = {
        $gte: searchDate,
        $lt: nextDate
      };
    }

    const flights = await Flight.find(query).sort({ price: 1 }).limit(20);
    
    // If no exact flights, maybe return some flights between those cities regardless of date just for demo purposes
    if (flights.length === 0 && date) {
      const fallbackFlights = await Flight.find({
        source: source.toLowerCase(),
        destination: destination.toLowerCase()
      }).sort({ price: 1 }).limit(10);
      
      return res.json({ 
        flights: fallbackFlights,
        message: 'No exact matches for date, showing alternative dates'
      });
    }

    res.json({ flights });
  } catch (error) {
    console.error('[Flight Search]', error);
    res.status(500).json({ message: 'Server error searching flights' });
  }
});

module.exports = router;
