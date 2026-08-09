const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { verifyToken } = require('../middleware/auth');

// 1. Get live community feed
router.get('/posts', verifyToken, async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate('userId', 'username profileBadge')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching posts', error: error.message });
  }
});

// 2. Create a new post
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newPost = new Post({
      userId: req.user.id,
      title,
      content,
      category
    });

    await newPost.save();
    res.status(201).json({ success: true, data: newPost, message: 'Post published successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating post', error: error.message });
  }
});

module.exports = router;
