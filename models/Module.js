const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
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

    // Short description shown in the course module list
    description: {
      type: String,
      required: true,
      trim: true
    },

    // Detailed introduction to the module
    introduction: {
      type: String,
      required: true,
      trim: true
    },

    // What students should learn in this module
    learningObjectives: {
      type: [String],
      default: []
    },

    // Approximate total time for the module
    estimatedDuration: {
      type: Number,
      required: true,
      min: 1
    },

    // Skills students should develop
    skillsGained: {
      type: [String],
      default: []
    },

    // Expected results after completing the module
    outcomes: {
      type: [String],
      default: []
    },

    order: {
      type: Number,
      required: true,
      min: 1
    },

    published: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// =========================================================
// INDEX
// =========================================================

// A module slug only needs to be unique inside its course.
// This allows different courses to have modules with the
// same slug without causing a database conflict.
moduleSchema.index(
  { courseId: 1, slug: 1 },
  { unique: true }
);

module.exports = mongoose.model('Module', moduleSchema);
