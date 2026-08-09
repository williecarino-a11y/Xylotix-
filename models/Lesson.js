const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  moduleNumber: { type: Number, required: true },
  lessonNumber: { type: Number, required: true },
  contentMarkdown: { type: String, required: true }, // Rich text / educational breakdown
  quiz: {
    question: { type: String },
    options: [{ type: String }],
    correctAnswerIndex: { type: Number }
  }
});

module.exports = mongoose.model('Lesson', lessonSchema);
