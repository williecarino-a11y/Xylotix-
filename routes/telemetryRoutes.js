const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const ErrorLog = require('../models/ErrorLog');
const DailyStat = require('../models/DailyStat');
const ActiveDay = require('../models/ActiveDay');
const analytics = require('../services/analyticsService');

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

function pct(kept, eligible) {
  return eligible ? Math.round((100 * kept) / eligible) + '%' : 'not enough data yet';
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
    'th{color:#8b95ad;font-weight:600}.n{text-align:right;font-variant-numeric:tabular-nums}.m{color:#94a3b8;font-size:.8rem;word-break:break-word}' +
    '.big{display:flex;gap:10px;flex-wrap:wrap}.card{flex:1 1 130px;background:#111a30;border:1px solid #1c2640;border-radius:14px;padding:12px 14px}' +
    '.card b{display:block;font-size:1.6rem;font-variant-numeric:tabular-nums}.card span{color:#8b95ad;font-size:.75rem}</style>' +
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

  /* ---------- usage counts ---------- */
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
        ActiveDay.updateOne({ hash, day }, { $setOnInsert: { createdAt: new Date() } }, { upsert: true }),
        // the same person keeps the same anonymous code every day, so we can see who comes back
        analytics.recordActivity(req.authUser._id, name !== 'app_open')
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

      const [active, events, errors, report] = await Promise.all([
        ActiveDay.aggregate([{ $match: { day: { $gte: days[13] } } }, { $group: { _id: '$day', n: { $sum: 1 } } }]),
        DailyStat.aggregate([
          { $match: { day: { $gte: since7 } } },
          { $group: { _id: '$key', n: { $sum: '$count' } } },
          { $sort: { n: -1 } }
        ]),
        ErrorLog.find().sort({ lastSeenAt: -1 }).limit(25),
        analytics.getReport().catch(function (e) { console.error('Analytics report failed:', e); return null; })
      ]);

      const activeMap = new Map(active.map(function (a) { return [a._id, a.n]; }));

      let people = '';
      let learning = '';
      if (report) {
        const p = report.people, L = report.learning, r = p.retention;
        people =
          '<h2>People</h2><div class="big">' +
          '<div class="card"><b>' + p.dau + '</b><span>today</span></div>' +
          '<div class="card"><b>' + p.wau + '</b><span>last 7 days</span></div>' +
          '<div class="card"><b>' + p.mau + '</b><span>last 30 days</span></div>' +
          '<div class="card"><b>' + p.engaged7 + '</b><span>did more than open it (7 days)</span></div>' +
          '<div class="card"><b>' + p.new7 + '</b><span>new in 7 days</span></div>' +
          '<div class="card"><b>' + p.totalPeople + '</b><span>people seen in total</span></div></div>' +
          '<p class="m">Counting started on ' + esc(report.since || 'no data yet') + '. People first seen that day may have joined earlier, so "new" is high at first.</p>' +
          '<h2>Do they come back?</h2><table>' +
          '<tr><td>Came back at least once</td><td class="n">' + pct(p.returnedEver.kept, p.returnedEver.eligible) + '</td></tr>' +
          '<tr><td>Day 1 <span class="m">(' + r[1].kept + ' of ' + r[1].eligible + ')</span></td><td class="n">' + pct(r[1].kept, r[1].eligible) + '</td></tr>' +
          '<tr><td>Day 7 <span class="m">(' + r[7].kept + ' of ' + r[7].eligible + ')</span></td><td class="n">' + pct(r[7].kept, r[7].eligible) + '</td></tr>' +
          '<tr><td>Day 30 <span class="m">(' + r[30].kept + ' of ' + r[30].eligible + ')</span></td><td class="n">' + pct(r[30].kept, r[30].eligible) + '</td></tr></table>' +
          '<p class="m">Day 7 means: of the people who first used Miimiid at least a week ago, how many used it again exactly 7 days after their first day.</p>';

        learning =
          '<h2>Learning, last 7 days</h2><div class="big">' +
          '<div class="card"><b>' + L.lessons7 + '</b><span>lessons completed</span></div>' +
          '<div class="card"><b>' + L.learners7 + '</b><span>people finished a lesson</span></div>' +
          '<div class="card"><b>' + L.quizAttempts7 + '</b><span>quizzes submitted</span></div>' +
          '<div class="card"><b>' + (L.quizAvg == null ? '-' : L.quizAvg + '%') + '</b><span>average quiz score</span></div></div>' +
          (L.top.length
            ? '<h2>Most completed lessons</h2><table><tr><th>Lesson</th><th class="n">Finished</th><th class="n">People</th></tr>' +
              L.top.map(function (t) {
                return '<tr><td>' + esc(t.title || t.id) + '</td><td class="n">' + t.n + '</td><td class="n">' + t.learners + '</td></tr>';
              }).join('') + '</table>'
            : '<p class="m">No lesson completions recorded yet. They appear here after the next lessons are finished.</p>') +
          '<p class="m">Finishing lessons and quizzes shows learning activity, not lasting understanding.</p>';
      }

      const body =
        '<h1>Miimiid health</h1>' + people + learning +
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
          : '<p class="m">No errors recorded.</p>');

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
