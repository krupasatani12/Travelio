const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  type: { type: String, enum: ['otp', 'itinerary', 'alert'], required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  errorMsg: { type: String, default: null },
}, { timestamps: { currentTime: getISTTime } });

module.exports = mongoose.model('EmailLog', emailLogSchema);
