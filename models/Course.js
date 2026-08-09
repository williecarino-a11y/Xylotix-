const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, enum: ['Money Basics', 'Saving', 'Credit & Debt', 'Investing', 'Business & Income'] },
  instructor: { type: String, default: 'Xylotix Team' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
