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
 * index.html still contains legacy authentication markup and its legacy
 * application bootstrap. Until that legacy bootstrap is removed from the
 * page itself, the server must establish the runtime boundary explicitly.
 */
app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // Ensure there is exactly one authentication-engine runtime.
    html = html.replace(/<script\s+type=["']module["']\s+src=["']\/auth-engine\.js["'][^>]*><\/script>/gi, '');
    html = html.replace(/<script\s+src=["']\/miimiid-auth-engine(?:-v[2-9])?\.js["'][^>]*><\/script>/gi, '');

    // Prevent the legacy application initializer from owning the page.
    html = html.replace(/if\s*\(document\.readyState\s*===\s*["']loading["']\s*\)\s*\{[\s\S]*?document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*initializeMiimiidApplication\s*\)\s*;?\s*\}\s*else\s*\{[\s\S]*?initializeMiimiidApplication\s*\(\s*\)\s*;?\s*\}/g, '/* Authentication engine owns application bootstrap. */');
    html = html.replace(/\binitializeMiimiidApplication\s*\(\s*\)\s*;?/g, '/* legacy application bootstrap disabled */');

    // Boot the centralized auth engine after the document has been parsed.
    html = html.replace(/<\/head>/i, '  <script type="module" src="/auth-engine.js"></script>\n</head>');

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