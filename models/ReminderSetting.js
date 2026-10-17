const mongoose = require('mongoose');

const reminderSettingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    enabled: { type: Boolean, default: false },
    hour: { type: Number, default: 18, min: 0, max: 23 },
    minute: { type: Number, default: 0, min: 0, max: 59 },
    timezone: { type: String, default: 'UTC' },

    // Which extra notifications this user wants
    streakAlerts: { type: Boolean, default: true },
    reviewNudges: { type: Boolean, default: true },

    // Used so each notification is sent at most once per day / week
    lastSentDate: { type: String, default: null },
    lastStreakAlertDate: { type: String, default: null },
    lastReviewNudgeAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReminderSetting', reminderSettingSchema);
