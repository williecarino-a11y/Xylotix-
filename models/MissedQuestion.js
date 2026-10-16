const mongoose = require('mongoose');

const missedQuestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    missCount: { type: Number, default: 1, min: 1 },
    lastMissedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// One entry per user per question
missedQuestionSchema.index({ userId: 1, quizId: 1 }, { unique: true });

module.exports = mongoose.model('MissedQuestion', missedQuestionSchema);
