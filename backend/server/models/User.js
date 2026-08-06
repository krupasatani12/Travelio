const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  credits: { type: Number, default: 100 },
  maxCredits: { type: Number, default: 100 },
  lastLoginTime: { type: Date },
  preferences: {
    travelStyle: [{ type: String }],
    preferredClimate: { type: String },
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 50000 },
    },
  },
  savedDestinations: [{ type: String }],
  creditUsage: [{
    service: { type: String },
    creditsUsed: { type: Number },
    date: { type: Date, default: getISTTime }
  }],
}, { timestamps: { currentTime: getISTTime } });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
