const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    // Longer introduction displayed on the course page
    longDescription: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },

    estimatedDuration: {
      type: Number,
      required: true,
      min: 1
    },

    // What students should already know before starting
    prerequisites: {
      type: [String],
      default: []
    },

    // Who the course is designed for
    targetAudience: {
      type: [String],
      default: []
    },

    // Main things students will learn
    learningObjectives: {
      type: [String],
      default: []
    },

    // Practical abilities students should gain
    skillsGained: {
      type: [String],
      default: []
    },

    // Expected results after completing the course
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
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Course', courseSchema);
