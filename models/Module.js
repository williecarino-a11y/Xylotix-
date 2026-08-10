const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true }
}, { timestamps: true });

// Scoped uniqueness: slug must be unique within the same course
moduleSchema.index({ courseId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Module', moduleSchema);
