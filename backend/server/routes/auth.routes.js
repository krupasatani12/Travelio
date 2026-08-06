const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, generateOTP } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const otp = generateOTP();
    const user = await User.create({
      name, email, password,
      otp, otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    try { await sendOTPEmail(email, otp, name); } catch (e) {
      console.log('[Email] OTP send failed (SMTP not configured):', e.message);
      console.log(`\n================================`);
      console.log(`🔐 YOUR OTP CODE IS: ${otp}`);
      console.log(`================================\n`);
    }

    res.status(201).json({ message: 'Registration successful! Check your email for the OTP.', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.json({ message: 'Already verified' });
    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Require OTP if not verified
    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      try { await sendOTPEmail(email, otp, user.name); } catch (e) {
        console.log('[Email] OTP send failed (SMTP not configured):', e.message);
        console.log(`\n================================`);
        console.log(`🔐 YOUR OTP CODE IS: ${otp}`);
        console.log(`================================\n`);
      }
      return res.status(401).json({ requiresOtp: true, email: user.email, message: 'Please verify your email to login. Check your inbox for the OTP.' });
    }

    // IST daily credit reset logic
    const now = new Date();
    const isSameDayIST = (d1, d2) => {
      if (!d1 || !d2) return false;
      const fmt = (d) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' });
      return fmt(d1) === fmt(d2);
    };

    if (!user.lastLoginTime || !isSameDayIST(now, user.lastLoginTime)) {
      user.credits = user.maxCredits || 100;
      user.lastLoginTime = now;
    }
    
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({
      token, user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, isVerified: user.isVerified,
        preferences: user.preferences, savedDestinations: user.savedDestinations,
        credits: user.credits, maxCredits: user.maxCredits,
        creditUsage: user.creditUsage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const now = new Date();
    
    // IST daily credit reset logic on fetch
    let creditsUpdated = false;
    const isSameDayIST = (d1, d2) => {
      if (!d1 || !d2) return false;
      const fmt = (d) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'numeric', day: 'numeric' });
      return fmt(d1) === fmt(d2);
    };

    if (!user.lastLoginTime || !isSameDayIST(now, user.lastLoginTime)) {
      user.credits = user.maxCredits || 100;
      user.lastLoginTime = now;
      creditsUpdated = true;
    }
    
    if (creditsUpdated) {
      await user.save();
    }
    
    res.json({
      user: {
        id: user._id, name: user.name, email: user.email,
        role: user.role, isVerified: user.isVerified,
        preferences: user.preferences, savedDestinations: user.savedDestinations,
        credits: user.credits, maxCredits: user.maxCredits,
        creditUsage: user.creditUsage
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/preferences
router.put('/preferences', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { preferences: req.body }, { new: true });
    res.json({ preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
