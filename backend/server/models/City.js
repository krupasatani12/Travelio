const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  state: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  teaser: { type: String },
  image: { type: String },
  images: [{ type: String }],
  type: { type: String },
  placesCount: { type: Number, default: 0 },
  aiSummary: { type: String }
});

// Compound unique index
citySchema.index({ name: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
