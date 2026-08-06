const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  cityName: { type: String, required: true },
  state: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  type: { type: String },
  rating: { type: Number },
  entrance_fee: { type: Number },
  review_count_lakhs: { type: Number, default: 0 },
  latitude: { type: Number },
  longitude: { type: Number },
  best_time: { type: String },
  teaser: { type: String },
  image: { type: String },
  images: [{ type: String }]
});

module.exports = mongoose.model('Place', placeSchema);
