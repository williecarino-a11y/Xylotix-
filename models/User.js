const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },


    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 254,
      unique: true,
      sparse: true
    },


    dateOfBirth: {
      type: Date,
      default: null
    },

    passwordHash: {
      type: String,
      required: true
    },

    /*
     * Verification lifecycle.
     *
     * Existing users receive the compatibility defaults.
     * New registration will explicitly create an unverified
     * account and move these values to false.
     */
    emailVerified: {
      type: Boolean,
      default: true
    },


    accountVerified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
