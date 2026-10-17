const mongoose = require('mongoose');

// One anonymous marker per active user per day. The hash changes every day and cannot be traced back to a person.
const activeDaySchema = new mongoose.Schema({
  hash: { type: String, required: true },
  day: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 120 * 24 * 60 * 60 }
});

activeDaySchema.index({ hash: 1, day: 1 }, { unique: true });
activeDaySchema.index({ day: 1 });

module.exports = mongoose.model('ActiveDay', activeDaySchema);
