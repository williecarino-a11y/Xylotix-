const mongoose = require('mongoose');

// =========================================================
// STRUCTURED CONTENT BLOCK
// =========================================================

const contentBlockSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
      min: 1
    },

    type: {
      type: String,
      enum: [
        'text',
        'heading',
        'subheading',
        'example',
        'callout',
        'key-concept',
        'comparison',
        'scenario',
        'activity',
        'reflection',
        'tip',
        'warning',
        'image',
        'video',
        'interactive',
        'formula',
        'summary'
      ],
      required: true
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    _id: false
  }
);

// =========================================================
// LESSON SCHEMA
// =========================================================

const lessonSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    // Short description displayed before opening the lesson
    description: {
      type: String,
      required: true,
      trim: true
    },

    // What the student should understand after completing the lesson
    learningObjectives: {
      type: [String],
      default: []
    },

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

    published: {
      type: Boolean,
      default: false
    },

    // Main educational content
    contentBlocks: {
      type: [contentBlockSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// =========================================================
// INDEXES
// =========================================================

// Slug must be unique within a module
lessonSchema.index(
  { moduleId: 1, slug: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'Lesson',
  lessonSchema
);
