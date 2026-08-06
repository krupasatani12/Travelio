const mongoose = require('mongoose');

const PackingListSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true },
  durationDays: { type: Number, required: true },
  style: { type: String, required: true },
  weather: { type: String },
  items: [{ item: String, category: String, checked: Boolean }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PackingList', PackingListSchema);
