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

/* Miimiid Auth Engine is the single authentication runtime owner. */
app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    html = html.replace(/<script\s+src=["']\/miimiid-auth-engine(?:-v[2-9])?\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\/miimiid-auth-engine\.css["'][^>]*>/gi, '');
    html = html.replace(/<\/head>/i,
      '  <script type="module" src="/auth-engine.js"></script>\n</head>'
    );

    // The auth engine owns authentication/application bootstrap.
    html = html.replace(/\n\s*fetchCourses\(\);\s*\n\s*<\/script>/,
      '\n    /* Authentication engine owns application boot. */\n\n  </script>'
    );
    html = html.replace(/\n\s*if \(document\.readyState === "loading"\) \{\s*document\.addEventListener\(\s*"DOMContentLoaded",\s*initializeMiimiidApplication\s*\);\s*\} else \{\s*initializeMiimiidApplication\(\);\s*\}\s*/,
      '\n    /* Authentication engine owns authentication/application bootstrap. */\n\n'
    );

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
