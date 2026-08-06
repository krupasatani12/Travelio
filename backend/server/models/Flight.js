const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  airline: { type: String, required: true },
  date_of_journey: { type: Date, required: true },
  source: { type: String, required: true, index: true },
  destination: { type: String, required: true, index: true },
  route: { type: String },
  dep_time: { type: String },
  arrival_time: { type: String },
  duration: { type: String },
  total_stops: { type: String },
  additional_info: { type: String },
  price: { type: Number, required: true }
}, {
  timestamps: { currentTime: getISTTime }
});

flightSchema.index({ source: 1, destination: 1, date_of_journey: 1 });

module.exports = mongoose.model('Flight', flightSchema);
