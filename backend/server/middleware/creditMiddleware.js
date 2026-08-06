const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

/**
 * Middleware to check and deduct credits
 * Must be used AFTER the `protect` middleware
 */
const requireCredits = (cost = 1, service = 'general') => {
  return async (req, res, next) => {
    try {
      const settings = await SystemSettings.findOne();
      if (settings && settings.mode === 'offline') {
        return next();
      }

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, login required to use AI' });
      }

      // Fetch latest user state
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.credits < cost) {
        return res.status(402).json({ 
          message: 'Out of credits! Wait until midnight IST for reset.',
          credits: user.credits,
          required: cost
        });
      }

      // Deduct credits
      user.credits -= cost;
      
      // Log usage
      if (!user.creditUsage) user.creditUsage = [];
      user.creditUsage.push({ service, creditsUsed: cost });

      await user.save();
      
      // Update req.user so downstream routes know the new balance
      req.user = user;
      
      next();
    } catch (err) {
      console.error('[Credit Middleware Error]', err.message);
      res.status(500).json({ message: 'Server error processing credits' });
    }
  };
};

module.exports = { requireCredits };
