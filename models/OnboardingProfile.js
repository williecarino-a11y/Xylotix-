const mongoose = require('mongoose');

const onboardingProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    goal: { type: String, default: '' },
    dailyMinutes: { type: Number, default: 10 },
    level: { type: String, default: 'beginner' },
    skipped: { type: Boolean, default: false },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OnboardingProfile', onboardingProfileSchema);
