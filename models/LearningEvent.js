const mongoose = require('mongoose');

// One row each time a learner finishes a lesson or submits a quiz. Same stable anonymous uid as UserDay.
const learningEventSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  day: { type: String, required: true },
  type: { type: String, enum: ['lesson_completed', 'quiz_submitted'], required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId },
  total: { type: Number },
  correct: { type: Number },
  createdAt: { type: Date, default: Date.now, expires: 400 * 24 * 60 * 60 }
});

learningEventSchema.index({ day: 1, type: 1 });
learningEventSchema.index({ lessonId: 1, type: 1 });

module.exports = mongoose.model('LearningEvent', learningEventSchema);
