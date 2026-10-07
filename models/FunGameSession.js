const mongoose = require('mongoose');

const purchasedItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      trim: true
    },

    optionId: {
      type: String,
      default: null,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    classification: {
      type: String,
      enum: ['need', 'want'],
      default: null
    },

    correct: {
      type: Boolean,
      default: false
    }
  },
  {
    _id: false
  }
);

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

    /*
     * ---------------------------------------------------------
     * SHOPPING GAME STATE
     * ---------------------------------------------------------
     * The server owns these values.
     * The client must never be trusted to provide prices,
     * spending totals, or remaining budget.
     */

    budget: {
      type: Number,
      default: 100,
      min: 0
    },

    spent: {
      type: Number,
      default: 0,
      min: 0
    },

    purchasedItems: {
      type: [purchasedItemSchema],
      default: []
    },

    /*
     * Flash sale (one per trip). The server decides what is on sale,
     * the sale price and when it ends. The client only displays it.
     */
    saleItemId: {
      type: String,
      default: null
    },

    salePrice: {
      type: Number,
      default: null,
      min: 0
    },

    saleEndsAt: {
      type: Date,
      default: null
    },

    /* Rival race (one per trip): another shopper takes an essential, it comes back pricier. */
    rivalItemId: {
      type: String,
      default: null
    },

    rivalTakesAt: {
      type: Date,
      default: null
    },

    rivalRestockAt: {
      type: Date,
      default: null
    },

    rivalPrice: {
      type: Number,
      default: null,
      min: 0
    },

    rivalBeaten: {
      type: Boolean,
      default: false
    },

    /* Price rise (one per trip): an essential costs more from then on. */
    hikeItemId: {
      type: String,
      default: null
    },

    hikePrice: {
      type: Number,
      default: null,
      min: 0
    },

    /*
     * ---------------------------------------------------------
     * GAME PROGRESSION
     * ---------------------------------------------------------
     */

    score: {
      type: Number,
      default: 0,
      min: 0
    },

    stars: {
      type: Number,
      default: 0,
      min: 0,
      max: 3
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

    currentCombo: {
      type: Number,
      default: 0,
      min: 0
    },

    completed: {
      type: Boolean,
      default: false
    },

    /*
     * ---------------------------------------------------------
     * REWARDS
     * ---------------------------------------------------------
     */

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

    /*
     * ---------------------------------------------------------
     * TIMESTAMPS
     * ---------------------------------------------------------
     */

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
