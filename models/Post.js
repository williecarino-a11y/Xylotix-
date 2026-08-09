const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true, enum: ['Personal Finance', 'Business', 'Students', 'Money-Making Skills', 'Banking'] },
  likesCount: { type: Number, default: 0 },
  repliesCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
