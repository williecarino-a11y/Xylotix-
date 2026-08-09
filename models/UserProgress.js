const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  currentStreak: { type: Number, default: 0 },
  knowledgeScore: { type: Number, default: 0 },
  learningPoints: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProgress', userProgressSchema);
