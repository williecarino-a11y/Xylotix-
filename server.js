require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/*
 * Serve index.html with auth-engine properly injected
 */
app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Ensure auth-engine.js is loaded
    if (!html.includes('auth-engine.js')) {
      html = html.replace(/<\/head>/i, '  <script type="module" src="/auth-engine.js"></script>\n</head>');
    }

    res.type('html').send(html);
  } catch (error) {
    next(error);
  }
});

app.use(express.static('public'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xylotix';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const { router: authRoutes } = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

const funCenterRoutes = require('./routes/funCenterRoutes');
app.use('/api/fun-center', funCenterRoutes);

const aiTutorRoutes = require('./routes/aiTutorRoutes');
app.use('/api/ai-tutor', aiTutorRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running cleanly.' });
});

app.listen(PORT, () => {
  console.log(`Miimiid server running on port ${PORT}`);
});
