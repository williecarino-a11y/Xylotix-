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

    /*
     * Authentication is a viewport boundary, not another dashboard mode.
     * Remove legacy auth-engine script variants and inject the one canonical
     * ES-module entry point exactly once.
     */
    html = html.replace(/<script\s+src=["']\/miimiid-auth-engine(?:-v[2-9])?\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script\s+type=["']module["']\s+src=["']\/auth-engine\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<link\s+rel=["']stylesheet["']\s+href=["']\/miimiid-auth-engine\.css["'][^>]*>/gi, '');
    html = html.replace(/<\/head>/i,
      '  <script type="module" src="/auth-engine.js"></script>\n</head>'
    );

    /*
     * The legacy application bootstrap must never race the Auth Engine.
     * These are invocation sites only; the function definitions remain in
     * index.html for legacy course/dashboard code that the authenticated
     * shell may still use.
     */
    html = html.replace(/(^|[\r\n])([ \t]*)fetchCourses\(\s*\);(?=[ \t]*(?:[\r\n]|<\/script>))/g,
      '$1$2/* Auth Engine owns application bootstrap. */$3'
    );
    html = html.replace(/(^|[\r\n])([ \t]*)initializeMiimiidApplication\(\s*\);(?=[ \t]*(?:[\r\n]|<\/script>))/g,
      '$1$2/* Auth Engine owns authentication/application bootstrap. */'
    );

    /*
     * Also remove the common DOMContentLoaded/readyState wrapper when it is
     * solely invoking initializeMiimiidApplication(). This prevents an older
     * boot path from becoming active if its formatting differs from the old
     * exact-string replacement.
     */
    html = html.replace(/\s*if\s*\(\s*document\.readyState\s*===\s*["']loading["']\s*\)\s*\{\s*document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*initializeMiimiidApplication\s*\)\s*;?\s*\}\s*else\s*\{\s*initializeMiimiidApplication\s*\(\s*\)\s*;?\s*\}/gi,
      '\n    /* Auth Engine owns authentication/application bootstrap. */\n'
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