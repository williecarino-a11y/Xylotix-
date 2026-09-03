require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

/* Baseline browser hardening without requiring a CSP rewrite of the authored inline UI. */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/*
 * Serve the authored application shell without replacing its DOM.
 * Only small, DOM-safe global helpers are injected here.
 */
app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    const headAssets = [
      '<link rel="stylesheet" href="/responsive.css">',
      '<script defer src="/auth-shell-fix.js"></script>',
      '<script defer src="/continue-loading.js"></script>',
      '<script defer src="/auth-bootstrap-guard.js"></script>'
    ];

    for (const asset of headAssets) {
      const marker = asset.includes('href=')
        ? asset.match(/href="([^"]+)"/)?.[1]
        : asset.match(/src="([^"]+)"/)?.[1];

      if (!marker || !html.includes(marker)) {
        html = html.replace(/<\/head>/i, `  ${asset}\n</head>`);
      }
    }

    res.type('html').send(html);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(__dirname, 'public'), {
  index: 'index.html',
  extensions: ['html']
}));

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://localhost:27017/xylotix';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });

const { router: authRoutes } = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

const funCenterRoutes = require('./routes/funCenterRoutes');
app.use('/api/fun-center', funCenterRoutes);

const aiTutorRoutes = require('./routes/aiTutorRoutes');
app.use('/api/ai-tutor', aiTutorRoutes);

app.get('/api/health', (req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
  const verificationEmail = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? 'configured'
    : 'not_configured';
  const aiTutor = process.env.OPENAI_API_KEY ? 'configured' : 'pending';
  const appBaseUrl = process.env.APP_BASE_URL || '';

  res.status(200).json({
    status: 'OK',
    message: 'Server is running cleanly.',
    services: {
      database,
      verificationEmail,
      aiTutor,
      passwordResetBaseUrl: appBaseUrl ? 'configured' : 'not_configured'
    }
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'API_ROUTE_NOT_FOUND',
    message: 'API route not found.'
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);

  if (res.headersSent) return next(error);

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong on the server.'
  });
});

app.listen(PORT, () => {
  console.log(`Miimiid server running on port ${PORT}`);
});
