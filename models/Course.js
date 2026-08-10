const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  durationMinutes: { type: Number, default: 5 },
  order: { type: Number, required: true },
  quiz: {
    question: String,
    options: [String],
    correctAnswerIndex: Number
  }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Money Basics', 'Saving', 'Credit & Debt'
  description: { type: String, required: true },
  modules: [moduleSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
