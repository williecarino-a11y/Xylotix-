const mongoose = require('mongoose');

// Holds the server's push keys (created automatically the first time they are needed)
const pushConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PushConfig', pushConfigSchema);
