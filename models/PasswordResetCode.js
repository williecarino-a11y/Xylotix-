const mongoose = require('mongoose');

const passwordResetCodeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    codeHash: {
      type: String,
      required: true
    },

    attempts: {
      type: Number,
      default: 0
    },

    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// MongoDB removes expired codes automatically.
passwordResetCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordResetCode', passwordResetCodeSchema);
