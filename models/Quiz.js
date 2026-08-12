const mongoose = require('mongoose');

/*
 * =========================================================
 * QUIZ / ASSESSMENT SCHEMA
 * =========================================================
 *
 * Supports:
 * - Multiple-choice questions
 * - True/false questions
 * - Calculation questions
 * - Explanations and feedback
 * - Hints
 * - Difficulty levels
 * - Skills being assessed
 * - Learning objectives
 * - Practical/application questions
 * - Optional media
 * - Points and ordering
 *
 * A quiz question belongs to exactly one lesson.
 */

const quizSchema = new mongoose.Schema(
  {
    /*
     * -------------------------------------------------------
     * LESSON RELATIONSHIP
     * -------------------------------------------------------
     */

    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true
    },

    /*
     * -------------------------------------------------------
     * QUESTION ORDER
     * -------------------------------------------------------
     */

    order: {
      type: Number,
      required: true,
      min: 1
    },

    /*
     * -------------------------------------------------------
     * QUESTION TYPE
     * -------------------------------------------------------
     */

    questionType: {
      type: String,
      enum: [
        'multiple-choice',
        'true-false',
        'calculate'
      ],
      required: true,
      default: 'multiple-choice'
    },

    /*
     * -------------------------------------------------------
     * QUESTION
     * -------------------------------------------------------
     */

    question: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * Optional longer context for questions that
     * require a scenario, case study, or application.
     */

    context: {
      type: String,
      default: '',
      trim: true
    },

    /*
     * -------------------------------------------------------
     * ANSWER OPTIONS
     * -------------------------------------------------------
     *
     * Used primarily by multiple-choice and true/false
     * questions.
     */

    options: {
      type: [String],
      default: []
    },

    /*
     * -------------------------------------------------------
     * CORRECT ANSWER
     * -------------------------------------------------------
     *
     * Multiple-choice:
     *   0, 1, 2, 3...
     *
     * True/false:
     *   0 or 1
     *
     * Calculate:
     *   Number
     *
     * Mixed allows the schema to support different
     * question formats without breaking existing data.
     */

    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    /*
     * -------------------------------------------------------
     * EXPLANATION
     * -------------------------------------------------------
     *
     * Shown after the student answers the question.
     */

    explanation: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * -------------------------------------------------------
     * HINT
     * -------------------------------------------------------
     *
     * Optional help that can be displayed before
     * the student submits an answer.
     */

    hint: {
      type: String,
      default: '',
      trim: true
    },

    /*
     * -------------------------------------------------------
     * FEEDBACK
     * -------------------------------------------------------
     *
     * Allows the frontend to display customized feedback
     * instead of browser alert() messages.
     */

    correctFeedback: {
      type: String,
      default: 'Excellent! 🎉 Your answer is correct.',
      trim: true
    },

    incorrectFeedback: {
      type: String,
      default: 'Not quite! Review the lesson and try again.',
      trim: true
    },

    /*
     * -------------------------------------------------------
     * DIFFICULTY
     * -------------------------------------------------------
     */

    difficulty: {
      type: String,
      enum: [
        'Easy',
        'Medium',
        'Hard'
      ],
      default: 'Easy'
    },

    /*
     * -------------------------------------------------------
     * SKILLS ASSESSED
     * -------------------------------------------------------
     *
     * Example:
     *
     * [
     *   'Cash flow analysis',
     *   'Budgeting',
     *   'Financial decision-making'
     * ]
     */

    skills: {
      type: [String],
      default: []
    },

    /*
     * -------------------------------------------------------
     * LEARNING OBJECTIVES
     * -------------------------------------------------------
     *
     * Identifies what the question is testing.
     */

    learningObjectives: {
      type: [String],
      default: []
    },

    /*
     * -------------------------------------------------------
     * PRACTICAL / APPLICATION QUESTION
     * -------------------------------------------------------
     *
     * Allows questions to represent real-world situations
     * rather than only testing definitions.
     */

    isPractical: {
      type: Boolean,
      default: false
    },

    /*
     * -------------------------------------------------------
     * MEDIA
     * -------------------------------------------------------
     *
     * Optional image/video reference for future lessons
     * and assessments.
     */

    media: {
      type: {
        type: String,
        enum: [
          'image',
          'video'
        ]
      },
      url: {
        type: String,
        trim: true
      },
      alt: {
        type: String,
        default: '',
        trim: true
      },
      caption: {
        type: String,
        default: '',
        trim: true
      }
    },

    /*
     * -------------------------------------------------------
     * POINTS
     * -------------------------------------------------------
     */

    points: {
      type: Number,
      required: true,
      default: 10,
      min: 1
    },

    /*
     * -------------------------------------------------------
     * PUBLISHED
     * -------------------------------------------------------
     *
     * Allows questions to be prepared without immediately
     * showing them to students.
     */

    published: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);


/*
 * =========================================================
 * VALIDATION
 * =========================================================
 *
 * Prevent invalid answer structures from being stored.
 */

quizSchema.pre('validate', function (next) {
  /*
   * Multiple-choice questions should have at least
   * two answer options.
   */

  if (
    this.questionType === 'multiple-choice' &&
    (!Array.isArray(this.options) || this.options.length < 2)
  ) {
    return next(
      new Error(
        'Multiple-choice questions must have at least two options.'
      )
    );
  }

  /*
   * True/false questions automatically use two options.
   */

  if (this.questionType === 'true-false') {
    this.options = ['True', 'False'];

    if (
      this.correctAnswer !== 0 &&
      this.correctAnswer !== 1
    ) {
      return next(
        new Error(
          'True/false correctAnswer must be 0 or 1.'
        )
      );
    }
  }

  /*
   * Multiple-choice correctAnswer must point to
   * an existing option.
   */

  if (this.questionType === 'multiple-choice') {
    if (
      typeof this.correctAnswer !== 'number' ||
      !Number.isInteger(this.correctAnswer) ||
      this.correctAnswer < 0 ||
      this.correctAnswer >= this.options.length
    ) {
      return next(
        new Error(
          'Multiple-choice correctAnswer must be a valid option index.'
        )
      );
    }
  }

  /*
   * Calculation questions should have a numeric answer.
   */

  if (
    this.questionType === 'calculate' &&
    typeof this.correctAnswer !== 'number'
  ) {
    return next(
      new Error(
        'Calculation questions require a numeric correctAnswer.'
      )
    );
  }

  next();
});


/*
 * =========================================================
 * INDEXES
 * =========================================================
 *
 * Prevent duplicate question ordering within a lesson.
 */

quizSchema.index(
  {
    lessonId: 1,
    order: 1
  },
  {
    unique: true
  }
);


/*
 * Useful when retrieving published quiz questions
 * in lesson order.
 */

quizSchema.index({
  lessonId: 1,
  published: 1,
  order: 1
});


module.exports = mongoose.model(
  'Quiz',
  quizSchema
);
