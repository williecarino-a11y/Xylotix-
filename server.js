require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
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

// Authentication API
const { router: authRoutes } =
  require('./routes/authRoutes');

app.use('/api/auth', authRoutes);

// Learning API
const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

const funCenterRoutes =
  require('./routes/funCenterRoutes');

app.use(
  '/api/fun-center',
  funCenterRoutes
);

// Miimiid AI Tutor API
const aiTutorRoutes = require('./routes/aiTutorRoutes');
app.use('/api/ai-tutor', aiTutorRoutes);

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
