const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Only one document should exist
  isSingleton: { type: Boolean, default: true, unique: true },
  
  llm: {
    temperature: { type: Number, default: 0.7, min: 0.0, max: 1.0 },
    maxTokens: { type: Number, default: 1024, min: 256, max: 4096 },
    topP: { type: Number, default: 0.9, min: 0.0, max: 1.0 },
    model: { type: String, default: 'mistral-small-latest' }
  },
  
  mode: { type: String, enum: ['online', 'offline'], default: 'online' },
  
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { currentTime: getISTTime } });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
