const mongoose = require('mongoose');

const funGameProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    totalXP: {
      type: Number,
      default: 0,
      min: 0
    },

    ownedCarts: {
      type: [String],
      default: []
    },

    cartSkin: {
      type: String,
      default: ''
    },

    totalCoins: {
      type: Number,
      default: 0,
      min: 0
    },
      
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0
    },

    gamesCompleted: {
      type: Number,
      default: 0,
      min: 0
    },

    totalRoundsPlayed: {
      type: Number,
      default: 0,
      min: 0
    },

    bestScores: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'FunGameProfile',
  funGameProfileSchema
);
