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
 * Unified authentication engine bootstrap.
 *
 * The engine is intentionally loaded synchronously in <head> so it can
 * establish the single authentication event owner before the large legacy
 * inline application script attaches its handlers.
 *
 * Authentication owns application boot: legacy authentication bootstrap
 * and the immediate course bootstrap are suppressed. Auth v3 is therefore
 * the only runtime owner responsible for session restoration and crossing
 * the authenticated application boundary.
 */
app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    html = html.replace(/<script\s+src=["']\/miimiid-auth-engine-(?:v2|v3)\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\/miimiid-auth-engine\.css["'][^>]*>/gi, '');

    html = html.replace(
      /<\/head>/i,
      '  <link rel="stylesheet" href="/miimiid-auth-engine.css">\n  <script src="/miimiid-auth-engine-v3.js"></script>\n</head>'
    );

    // Prevent the legacy learning bootstrap from running before auth.
    html = html.replace(
      /\n\s*fetchCourses\(\);\n\s*\n\s*<\/script>/,
      '\n    /* Authentication engine owns application boot. */\n\n  </script>'
    );

    // Prevent the legacy authentication bootstrap from competing with v3.
    html = html.replace(
      /\n\s*if \(document\.readyState === "loading"\) \{\s*document\.addEventListener\(\s*"DOMContentLoaded",\s*initializeMiimiidApplication\s*\);\s*\} else \{\s*initializeMiimiidApplication\(\);\s*\}\s*/,
      '\n    /* Auth v3 owns authentication/application bootstrap. */\n\n'
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
