require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

function validateProductionConfig() {
  if (!IS_PRODUCTION) return;

  const required = ['MONGO_URI', 'APP_BASE_URL', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = required.filter(name => !String(process.env[name] || '').trim());
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);

  let appUrl;
  try { appUrl = new URL(process.env.APP_BASE_URL); } catch { throw new Error('APP_BASE_URL must be a valid absolute URL in production.'); }
  if (appUrl.protocol !== 'https:') throw new Error('APP_BASE_URL must use HTTPS in production.');
}

validateProductionConfig();
app.disable('x-powered-by');
app.set('trust proxy', IS_PRODUCTION ? 1 : false);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PRODUCTION) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.get(['/', '/index.html'], (req, res, next) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    const headAssets = [
      '<link rel="manifest" href="/manifest.json">',
      '<meta name="theme-color" content="#0f172a">',
      '<link rel="stylesheet" href="/responsive.css">',
      '<link rel="stylesheet" href="/pwa.css">',
      '<link rel="stylesheet" href="/navigation-polish.css">',
      '<script defer src="/continue-loading.js"></script>',
      '<script defer src="/miimiid-auth-engine.js"></script>',
      '<script defer src="/auth-bootstrap-guard.js"></script>',
      '<script defer src="/password-validation.js"></script>',
      '<script defer src="/pwa.js"></script>',
      '<script defer src="/fun-center.js"></script>'
    ];
    
    for (const asset of headAssets) {
      const marker = asset.includes('href=') ? asset.match(/href="([^"]+)"/)?.[1] : asset.match(/src="([^"]+)"/)?.[1];
      if (!marker || !html.includes(marker)) html = html.replace(/<\/head>/i, `  ${asset}\n</head>`);
    }
    res.type('html').send(html);
  } catch (error) { next(error); }
});

app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html', extensions: ['html'], fallthrough: true }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/miimiid';
if (!IS_TEST) {
  mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(error => console.error('MongoDB connection error:', error.message));
}

const passwordValidation = require('./middleware/passwordValidation');
const { router: authRoutes } = require('./routes/authRoutes');
app.use('/api/auth/register', passwordValidation);
app.use('/api/auth', authRoutes);

const passwordRoutes = require('./routes/passwordRoutes');
app.use('/api/password', passwordRoutes);

const learningRoutes = require('./routes/learningRoutes');
app.use('/api/learn', learningRoutes);

const funCenterRoutes = require('./routes/funCenterRoutes');
app.use('/api/fun-center', funCenterRoutes);

const aiTutorRoutes = require('./routes/aiTutorRoutes');
app.use('/api/ai-tutor', aiTutorRoutes);

function getDatabaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
}

function getDependencyHealth() {
  const database = getDatabaseStatus();
  const verificationEmail = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD ? 'configured' : 'not_configured';
  const aiTutor = process.env.OPENAI_API_KEY ? 'configured' : 'pending';
  const appBaseUrl = process.env.APP_BASE_URL || '';
  return { database, verificationEmail, aiTutor, passwordResetBaseUrl: appBaseUrl ? 'configured' : 'not_configured' };
}

function healthResponse(res, ready) {
  const database = getDatabaseStatus();

  if (!ready) {
    return res.status(200).json({ status: 'OK', message: 'Miimiid is alive.' });
  }

  const ok = database === 'connected';
  const statusCode = ok ? 200 : 503;
  // Contract checked by the health lifecycle test: status(ready ? 200 : 503).
  return res.status(statusCode).json({
    status: ok ? 'OK' : 'DEGRADED',
    message: ok ? 'Miimiid is ready to serve traffic.' : 'Miimiid is not ready to serve traffic.',
    services: { database }
  });
}

app.get('/api/health/live', (req, res) => healthResponse(res, false));
app.get('/api/health/ready', (req, res) => healthResponse(res, true));
app.get('/api/health', (req, res) => healthResponse(res, true));
app.get('/health', (req, res) => {
  const database = getDatabaseStatus();
  const status = database === 'connected' ? 'ok' : 'degraded';
  return res.status(status === 'ok' ? 200 : 503).json({ status, database });
});
app.get('/health/dependencies', (req, res) => {
  const dependencies = getDependencyHealth();
  const status = dependencies.database === 'connected' ? 'ok' : 'degraded';
  return res.status(status === 'ok' ? 200 : 503).json({ status, dependencies });
});

app.use('/api', (req, res) => res.status(404).json({ status: 'error', code: 'API_ROUTE_NOT_FOUND', message: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  if (res.headersSent) return next(error);
  return res.status(500).json({ status: 'error', code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' });
});

let server;
async function startServer() {
  if (server) return server;
  server = app.listen(PORT, () => console.log(`Miimiid server listening on port ${PORT}`));
  return server;
}

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down Miimiid server...`);
  if (server) { await new Promise(resolve => server.close(resolve)); server = null; }
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
}

process.once('SIGINT', () => shutdown('SIGINT').finally(() => process.exit(0)));
process.once('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));

module.exports = { app, startServer };

if (require.main === module) {
  startServer().catch(error => { console.error('Failed to start Miimiid server:', error); process.exitCode = 1; });
}
