const mongoose = require('mongoose');

const funGameSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    gameId: {
      type: String,
      required: true,
      index: true
    },

    score: {
      type: Number,
      default: 0,
      min: 0
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0
    },

    roundsCompleted: {
      type: Number,
      default: 0,
      min: 0
    },

    maxCombo: {
      type: Number,
      default: 0,
      min: 0
    },

    completed: {
      type: Boolean,
      default: false
    },

    rewardGranted: {
      type: Boolean,
      default: false
    },

    xpAwarded: {
      type: Number,
      default: 0,
      min: 0
    },

    coinsAwarded: {
      type: Number,
      default: 0,
      min: 0
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'FunGameSession',
  funGameSessionSchema
);
