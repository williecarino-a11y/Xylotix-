const mongoose = require('mongoose');

const dailyStatSchema = new mongoose.Schema({
  day: { type: String, required: true },
  key: { type: String, required: true },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 400 * 24 * 60 * 60 }
});

dailyStatSchema.index({ day: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('DailyStat', dailyStatSchema);
