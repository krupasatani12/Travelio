const { getISTTime } = require('../utils/time');
const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  method: { type: String, required: true },
  endpoint: { type: String, required: true },
  statusCode: { type: Number },
  responseTime: { type: Number },
  ip: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: { currentTime: getISTTime } });

// Index for efficient querying by time (for charts)
apiLogSchema.index({ createdAt: -1 });
apiLogSchema.index({ endpoint: 1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);
