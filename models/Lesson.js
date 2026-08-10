const mongoose = require('mongoose');

// Structured Content Block Schema
const contentBlockSchema = new mongoose.Schema({
  order: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  type: { 
    type: String, 
    enum: ['text', 'example', 'callout', 'image', 'video', 'interactive'], 
    required: true 
  },
  data: { type: mongoose.Schema.Types.Mixed, required: true } // Flexible payload for block content
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
  slug: { type: String, required: true, lowercase: true, trim: true },
  title: { type: String, required: true },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  published: { type: Boolean, default: false },
  contentBlocks: [contentBlockSchema] // Replaces flat string content
}, { timestamps: true });

// Scoped uniqueness: slug must be unique within the same module
lessonSchema.index({ moduleId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Lesson', lessonSchema);
