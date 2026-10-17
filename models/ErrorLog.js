const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, unique: true },
  message: { type: String, required: true, maxlength: 300 },
  source: { type: String, default: '', maxlength: 200 },
  page: { type: String, default: '', maxlength: 120 },
  stack: { type: String, default: '', maxlength: 1500 },
  userAgent: { type: String, default: '', maxlength: 160 },
  line: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
  firstSeenAt: { type: Date, default: Date.now },
  // Errors that stop happening disappear after 30 days
  lastSeenAt: { type: Date, default: Date.now, expires: 30 * 24 * 60 * 60 }
});

module.exports = mongoose.model('ErrorLog', errorLogSchema);
