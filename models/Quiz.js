const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },

  order: {
    type: Number,
    required: true,
    min: 1
  },

  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'calculate'],
    required: true,
    default: 'multiple-choice'
  },

  question: {
    type: String,
    required: true,
    trim: true
  },

  options: {
    type: [String],
    default: []
  },

  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  explanation: {
    type: String,
    required: true,
    trim: true
  },

  points: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  }

}, { timestamps: true });

// Prevent duplicate quiz ordering within a lesson
quizSchema.index(
  { lessonId: 1, order: 1 },
  { unique: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
