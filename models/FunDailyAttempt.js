const mongoose = require('mongoose');

const funDailyAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayKey: { type: String, required: true },
    sessionId: { type: String, required: true },
    status: { type: String, enum: ['started', 'completed'], default: 'started' },
    score: { type: Number, default: 0, min: 0 },
    stars: { type: Number, default: 0, min: 0, max: 3 },
    spent: { type: Number, default: 0, min: 0 },
    saved: { type: Number, default: 0, min: 0 },
    needsCovered: { type: Number, default: 0, min: 0 },
    totalNeeds: { type: Number, default: 0, min: 0 },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// one attempt per player per day, enforced by the database
funDailyAttemptSchema.index({ userId: 1, dayKey: 1 }, { unique: true });

// fast "top scores for a day" lookups
funDailyAttemptSchema.index({ dayKey: 1, status: 1, score: -1 });

module.exports = mongoose.model('FunDailyAttempt', funDailyAttemptSchema);
