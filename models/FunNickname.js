const mongoose = require('mongoose');

const funNicknameSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    nickname: { type: String, required: true, trim: true, maxlength: 16 },
    nicknameLower: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FunNickname', funNicknameSchema);
