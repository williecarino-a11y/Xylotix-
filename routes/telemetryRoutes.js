const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const ErrorLog = require('../models/ErrorLog');
const DailyStat = require('../models/DailyStat');
const ActiveDay = require('../models/ActiveDay');

const EVENTS = new Set([
  'app_open',
  'screen_home',
  'screen_learn',
  'screen_funCenter',
  'screen_aiTutor',
  'lesson_open',
  'lesson_completed'
]);

const MAX_DISTINCT_ERRORS = 2000;

function dayKey(date) { return date.toISOString().slice(0, 10); }

function clip(value, max) { return typeof value === 'string' ? value.slice(0, max) : ''; }

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

function page(title, body) {
  return '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex"><title>' + esc(title) + '</title>' +
    '<style>body{font-family:system-ui,sans-serif;background:#0b1220;color:#e6e9f0;margin:0;padding:20px;max-width:720px;margin-inline:auto}' +
    'h1{font-size:1.3rem}h2{font-size:.8rem;letter-spacing:.07em;text-transform:uppercase;color:#8b95ad;margin:28px 0 8px}' +
    'table{width:100%;border-collapse:collapse}td,th{padding:9px 6px;border-bottom:1px solid #1c2640;text-align:left;font-size:.9rem;vertical-align:top}' +
    'th{color:#8b95ad;font-weight:600}.n{text-align:right;font-variant-numeric:tabular-nums}.m{color:#94a3b8;font-size:.8rem;word-break:break-word}</style>' +
    '</head><body>' + body + '</body></html>';
}

module.exports = function createTelemetryRoutes({ requireAuth }) {
  const router = express.Router();

  const errorLimiter = rateLimit({
    windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => res.status(204).end()
  });
  const eventLimiter = rateLimit({
    windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => res.status(204).end()
  });
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
    handler: (req, res) => res.status(404).end()
  });

  /* ---------- app errors (works before login too) ---------- */
  router.post('/error', errorLimiter, async function (req, res) {
    try {
      const b = req.body || {};
      const message = clip(b.message, 300).trim();
      if (!message) return res.status(204).end();

      const source = clip(b.source, 200).split('?')[0];
      const fingerprint = crypto.createHash('sha1').update(message + '|' + source).digest('hex');

      const known = await ErrorLog.exists({ fingerprint });
      if (!known && (await ErrorLog.estimatedDocumentCount()) >= MAX_DISTINCT_ERRORS) {
        return res.status(204).end();
      }

      const now = new Date();
      await ErrorLog.findOneAndUpdate(
        { fingerprint },
        {
          $inc: { count: 1 },
          $set: {
            lastSeenAt: now,
            page: clip(b.page, 120),
            stack: clip(b.stack, 1500),
            userAgent: clip(req.get('user-agent'), 160),
            line: Number(b.line) || 0
          },
          $setOnInsert: { message, source, firstSeenAt: now }
        },
        { upsert: true }
      );
      return res.status(204).end();
    } catch (error) {
      if (!(error && error.code === 11000)) console.error('Error log failed:', error);
      return res.status(204).end();
    }
  });

  /* ---------- anonymous usage counts ---------- */
  router.post('/event', requireAuth, eventLimiter, async function (req, res) {
    try {
      const name = req.body && req.body.name;
      if (!EVENTS.has(name)) return res.status(204).end();

      const day = dayKey(new Date());
      const secret = process.env.ANALYTICS_SALT || process.env.SESSION_SECRET || 'miimiid-analytics';
      const hash = crypto.createHmac('sha256', secret)
        .update(req.authUser._id.toString() + ':' + day).digest('hex');

      await Promise.all([
        DailyStat.updateOne({ day, key: name }, { $inc: { count: 1 }, $setOnInsert: { createdAt: new Date() } }, { upsert: true }),
        ActiveDay.updateOne({ hash, day }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true })
      ]);
      return res.status(204).end();
    } catch (error) {
      if (!(error && error.code === 11000)) console.error('Event log failed:', error);
      return res.status(204).end();
    }
  });

  /* ---------- your private dashboard ---------- */
  router.get('/admin', adminLimiter, async function (req, res) {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected || expected.length < 16) return res.status(404).end();
    if (!safeEqual(req.query.token || '', expected)) return res.status(404).end();

    try {
      const days = [];
      for (let i = 0; i < 14; i++) days.push(dayKey(new Date(Date.now() - i * 86400000)));
      const since7 = days[6];

      const [active, events, errors] = await Promise.all([
        ActiveDay.aggregate([{ $match: { day: { $gte: days[13] } } }, { $group: { _id: '$day', n: { $sum: 1 } } }]),
        DailyStat.aggregate([
          { $match: { day: { $gte: since7 } } },
          { $group: { _id: '$key', n: { $sum: '$count' } } },
          { $sort: { n: -1 } }
        ]),
        ErrorLog.find().sort({ lastSeenAt: -1 }).limit(25)
      ]);

      const activeMap = new Map(active.map(function (a) { return [a._id, a.n]; }));

      const body =
        '<h1>Miimiid health</h1>' +
        '<h2>Active users per day</h2><table>' +
        days.map(function (d) { return '<tr><td>' + d + '</td><td class="n">' + (activeMap.get(d) || 0) + '</td></tr>'; }).join('') +
        '</table>' +
        '<h2>Actions in the last 7 days</h2><table>' +
        (events.length
          ? events.map(function (e) { return '<tr><td>' + esc(e._id) + '</td><td class="n">' + e.n + '</td></tr>'; }).join('')
          : '<tr><td class="m">Nothing recorded yet.</td></tr>') +
        '</table>' +
        '<h2>Latest errors</h2>' +
        (errors.length
          ? '<table><tr><th>Error</th><th class="n">Times</th></tr>' +
            errors.map(function (e) {
              return '<tr><td>' + esc(e.message) +
                '<div class="m">' + esc(e.source || e.page) + (e.line ? ':' + e.line : '') + ' &middot; last ' + esc(e.lastSeenAt.toISOString().replace('T', ' ').slice(0, 16)) + ' UTC</div></td>' +
                '<td class="n">' + e.count + '</td></tr>';
            }).join('') + '</table>'
          : '<p class="m">No errors recorded. 🎉</p>');

      res.set('Cache-Control', 'no-store');
      res.set('Referrer-Policy', 'no-referrer');
      res.set('X-Robots-Tag', 'noindex');
      return res.status(200).type('html').send(page('Miimiid health', body));
    } catch (error) {
      console.error('Telemetry admin error:', error);
      return res.status(500).send('Could not load the dashboard.');
    }
  });

  return router;
};
