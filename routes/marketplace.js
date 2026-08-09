const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { verifyToken } = require('../middleware/auth');

// 1. Get all marketplace listings with optional search query & category filter
router.get('/listings', verifyToken, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }
    if (search) {
      query.title = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    const listings = await Listing.find(query).populate('userId', 'username rating').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching listings', error: error.message });
  }
});

// 2. Create a new listing
router.post('/listings', verifyToken, async (req, res) => {
  try {
    const { title, category, price, description, deliveryTime } = req.body;
    if (!title || !category || !price || !description) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const newListing = new Listing({
      userId: req.user.id,
      title,
      category,
      price,
      description,
      deliveryTime: deliveryTime || '3 days'
    });

    await newListing.save();
    res.status(201).json({ success: true, data: newListing, message: 'Listing created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating listing', error: error.message });
  }
});

module.exports = router;
