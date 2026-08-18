const mongoose = require('mongoose');

const verificationTokenSchema =
  new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      },

      tokenHash: {
        type: String,
        required: true,
        unique: true,
        index: true
      },

      purpose: {
        type: String,
        enum: [
          'account-verification',
          'email-verification',
          'phone-verification'
        ],
        default: 'account-verification',
        index: true
      },

      expiresAt: {
        type: Date,
        required: true,
        index: true
      },

      usedAt: {
        type: Date,
        default: null
      },

      attempts: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      }
    },
    {
      timestamps: true
    }
  );

verificationTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports =
  mongoose.model(
    'VerificationToken',
    verificationTokenSchema
  );
