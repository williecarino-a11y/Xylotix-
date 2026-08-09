const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true, enum: ['Digital Services', 'Jobs/Gigs', 'Products', 'Grants', 'Business Opportunities'] },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  deliveryTime: { type: String, default: '3 days' },
  status: { type: String, default: 'Active', enum: ['Active', 'Completed', 'Closed'] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Listing', listingSchema);
