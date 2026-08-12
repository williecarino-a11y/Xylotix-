require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database Connection
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/xylotix';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) =>
    console.error('MongoDB connection error:', err)
  );

// Learning API
const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running cleanly.'
  });
});

app.listen(PORT, () => {
  console.log(`Miimiid server running on port ${PORT}`);
});
