const mongoose = require('mongoose');

// One marker per person per day. "uid" is a keyed hash of the account id: it stays the same every day (so we can see who comes back),
// but it holds no email, name or account id and cannot be turned back into one without the secret ANALYTICS_SALT.
const userDaySchema = new mongoose.Schema({
  uid: { type: String, required: true },
  day: { type: String, required: true },
  engaged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 400 * 24 * 60 * 60 }
});

userDaySchema.index({ uid: 1, day: 1 }, { unique: true });
userDaySchema.index({ day: 1 });

module.exports = mongoose.model('UserDay', userDaySchema);
