const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId }],
  currentLessonId: { type: mongoose.Schema.Types.ObjectId },
  progressPercentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastAccessed: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProgress', userProgressSchema);
