const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const tripActualSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  destination:        { type: String, required: true },
  state:              { type: String },
  month:              { type: String, required: true },
  group_size:         { type: Number, default: 1 },
  comfort_level:      { type: String, default: 'mid' },
  planned_budget:     { type: Number },
  actual_spend_total: { type: Number, required: true },
  actual_hotel:       { type: Number, default: 0 },
  actual_food:        { type: Number, default: 0 },
  actual_transport:   { type: Number, default: 0 },
  actual_activities:  { type: Number, default: 0 },
  days_stayed:        { type: Number, required: true },
  forecast_error:     { type: Number },
  rating_value_for_money: { type: Number, default: 0 },
  source:             { type: String, default: 'journal' },
}, { timestamps: { currentTime: getISTTime } });

// Auto-calculate forecast error on save
tripActualSchema.pre('save', function(next) {
  if (this.actual_spend_total && this.planned_budget) {
    this.forecast_error = this.actual_spend_total - this.planned_budget;
  }
  next();
});

tripActualSchema.index({ destination: 1 });
tripActualSchema.index({ month: 1 });

module.exports = mongoose.model('TripActual', tripActualSchema);
