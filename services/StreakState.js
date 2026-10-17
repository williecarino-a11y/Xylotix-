const mongoose = require('mongoose');

const streakStateSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    timezone: { type: String, default: 'UTC' },
    freezes: { type: Number, default: 1, min: 0, max: 2 },
    frozenDays: { type: [String], default: [] },
    // The last 7-day milestone that already earned a freeze in the current streak
    awardedMilestone: { type: Number, default: 0 },
    // Things the learner has not been told about yet
    noticeFreezes: { type: Number, default: 0 },
    noticeEarned: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('StreakState', streakStateSchema);
