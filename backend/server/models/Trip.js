const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination:     { type: String, required: true },
  state:           { type: String, default: '' },
  travelMonth:     { type: String, default: '' },
  groupSize:       { type: Number, default: 1 },
  comfortLevel:    { type: String, enum: ['budget', 'mid', 'luxury'], default: 'mid' },
  durationDays:    { type: Number, default: 3 },
  estimatedBudget: { type: Number, default: 0 },
  status:          { type: String, enum: ['planned', 'confirmed', 'completed'], default: 'confirmed' },
  itinerary:       { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { currentTime: getISTTime } });

tripSchema.index({ userId: 1, destination: 1 });

module.exports = mongoose.model('Trip', tripSchema);
