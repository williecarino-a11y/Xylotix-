require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    const scripts = ['/auth-shell-fix.js', '/continue-loading.js'];
    for (const script of scripts) {
      if (!html.includes(script)) {
        html = html.replace(/<\/head>/i, `  <script defer src="${script}"></script>\n</head>`);
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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xylotix';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(error => console.error('MongoDB connection error:', error));

const { router: authRoutes } = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

const funCenterRoutes = require('./routes/funCenterRoutes');
app.use('/api/fun-center', funCenterRoutes);

const aiTutorRoutes = require('./routes/aiTutorRoutes');
app.use('/api/ai-tutor', aiTutorRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running cleanly.',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
      verificationEmail: process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD ? 'configured' : 'not_configured',
      aiTutor: process.env.OPENAI_API_KEY ? 'configured' : 'pending'
    }
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', code: 'API_ROUTE_NOT_FOUND', message: 'API route not found.' });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ status: 'error', code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => console.log(`Miimiid server running on port ${PORT}`));
