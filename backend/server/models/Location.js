const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  locationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  state: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  heroImage: { type: String },
  images: [{ type: String }],
  teaserText: { type: String },
  airbnbUrl: { type: String },
  googleMapsUrl: { type: String },
});

module.exports = mongoose.model('Location', locationSchema);
