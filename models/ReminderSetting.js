const mongoose = require('mongoose');

const reminderSettingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enabled: { type: Boolean, default: false },
    hour: { type: Number, default: 18, min: 0, max: 23 },
    minute: { type: Number, default: 0, min: 0, max: 59 },
    timezone: { type: String, default: 'UTC' },
    // The local date (YYYY-MM-DD) a reminder was last handled, so we never send two in one day
    lastSentDate: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderSetting', reminderSettingSchema);
