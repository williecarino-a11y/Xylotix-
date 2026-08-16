const mongoose = require('mongoose');

/*
 * =========================================================
 * MIIMIID TRANSLATION CACHE
 * =========================================================
 *
 * English is the canonical source language.
 *
 * A translation is cached against a hash of the original
 * English content. If the English content changes, the hash
 * changes and the old translation automatically becomes stale.
 */

const translationSchema = new mongoose.Schema(
  {
    sourceType: {
      type: String,
      required: true,
      enum: [
        'course',
        'module',
        'lesson',
        'quiz'
      ]
    },

    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    sourceLanguage: {
      type: String,
      required: true,
      default: 'en',
      lowercase: true,
      trim: true
    },

    targetLanguage: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    sourceHash: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * Translated structured data.
     *
     * This intentionally uses Mixed because courses,
     * lessons and quizzes have different structures.
     */
    translatedData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

/*
 * One current translation per source object + language +
 * source version.
 */
translationSchema.index(
  {
    sourceType: 1,
    sourceId: 1,
    sourceLanguage: 1,
    targetLanguage: 1,
    sourceHash: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  'Translation',
  translationSchema
);
