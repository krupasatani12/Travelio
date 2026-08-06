const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  location: { type: String, default: '' },
  images: [{ type: String }],
  tripDate: { type: Date },
  mood: { type: String, enum: ['amazing', 'good', 'okay', 'bad'], default: 'good' },
  rating: { type: Number, default: 0, min: 0, max: 5 },

  // Layer 2 — Verified Trip Badge
  isVerifiedTrip: { type: Boolean, default: false },
  tripRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },

  // Layer 3 — Structured Review Ratings
  ratingValueForMoney: { type: Number, default: 0, min: 0, max: 5 },
  ratingCrowds:        { type: Number, default: 0, min: 0, max: 5 },
  ratingCleanliness:   { type: Number, default: 0, min: 0, max: 5 },
  ratingSafetyFelt:    { type: Number, default: 0, min: 0, max: 5 },
  ratingWouldReturn:   { type: Boolean, default: null },
  actualSpendPerDay:   { type: Number, default: 0 },
  actualDaysStayed:    { type: Number, default: 0 },

  // Phase 3 — Enhanced Media & Community
  visibility: { type: String, enum: ['private', 'public'], default: 'private' },
  media: [{
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnail: { type: String }
  }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: getISTTime }
  }],
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Layer 4 — Engagement
  likes: { type: Number, default: 0 },
}, { timestamps: { currentTime: getISTTime } });

journalSchema.index({ userId: 1, createdAt: -1 });
journalSchema.index({ location: 1 });

module.exports = mongoose.model('Journal', journalSchema);
