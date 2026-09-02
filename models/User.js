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

    gender: {
      type: String,
      trim: true,
      maxlength: 50,
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
    /*
     * Defaults intentionally remain `true` for compatibility with
     * user documents that predate the verification feature and
     * don't have these fields stored at all — Mongoose applies the
     * schema default on hydration for any missing field, so
     * flipping this to `false` would silently "unverify" every
     * legacy user in the database.
     *
     * Safety currently relies on routes/authRoutes.js explicitly
     * passing emailVerified: false / accountVerified: false on
     * every new User.create() call — verified by grepping the repo
     * for all User-creation call sites (only one exists). If a
     * second call site is ever added, it MUST do the same, or run
     * a one-time migration to backfill these fields on existing
     * users before changing this default.
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
