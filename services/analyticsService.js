const crypto = require('crypto');
const mongoose = require('mongoose');

const UserDay = require('../models/UserDay');
const LearningEvent = require('../models/LearningEvent');

function dayKey(date) { return date.toISOString().slice(0, 10); }

function addDays(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
}

// Same person -> same code every day. Keyed with a secret, so it cannot be reversed without ANALYTICS_SALT.
// Keep ANALYTICS_SALT the same forever: if it changes, everyone looks like a new person.
function stableId(userId) {
  const secret = process.env.ANALYTICS_SALT || process.env.SESSION_SECRET || 'miimiid-analytics';
  return crypto.createHmac('sha256', secret).update('uid:' + String(userId)).digest('hex');
}

async function recordActivity(userId, engaged) {
  const update = { $setOnInsert: { createdAt: new Date() } };
  if (engaged) update.$set = { engaged: true };
  await UserDay.updateOne({ uid: stableId(userId), day: dayKey(new Date()) }, update, { upsert: true });
}

// Never throws: learning tracking must not break a lesson or a quiz.
async function logLearning(info) {
  try {
    const doc = { uid: stableId(info.userId), day: dayKey(new Date()), type: info.type };
    if (info.lessonId && mongoose.Types.ObjectId.isValid(info.lessonId)) doc.lessonId = info.lessonId;
    if (typeof info.total === 'number') doc.total = info.total;
    if (typeof info.correct === 'number') doc.correct = info.correct;
    await LearningEvent.create(doc);
  } catch (error) {
    console.error('Learning analytics failed:', error && error.message);
  }
}

// Reads a quiz result without assuming its exact shape: counts right answers only when each result says so.
function scoreFromResults(results) {
  if (!Array.isArray(results) || !results.length) return {};
  let known = false;
  let correct = 0;
  results.forEach(function (r) {
    if (r && (typeof r.isCorrect === 'boolean' || typeof r.correct === 'boolean')) {
      known = true;
      if (r.isCorrect === true || r.correct === true) correct += 1;
    }
  });
  return known ? { total: results.length, correct } : { total: results.length };
}

// Pure maths on [{ _id: uid, first: 'YYYY-MM-DD', days: [...] }]; easy to test.
function summarize(users, today) {
  const d7 = addDays(today, -6);
  const out = { totalPeople: users.length, new7: 0, retention: {}, returnedEver: { eligible: 0, kept: 0 } };
  [1, 7, 30].forEach(function (n) { out.retention[n] = { eligible: 0, kept: 0 }; });

  users.forEach(function (u) {
    if (u.first >= d7) out.new7 += 1;
    if (u.first < today) {
      out.returnedEver.eligible += 1;
      if (u.days.length > 1) out.returnedEver.kept += 1;
    }
    [1, 7, 30].forEach(function (n) {
      const target = addDays(u.first, n);
      if (target < today) {                       // that day is fully over, so it can be judged fairly
        out.retention[n].eligible += 1;
        if (u.days.indexOf(target) !== -1) out.retention[n].kept += 1;
      }
    });
  });
  return out;
}

async function distinctSince(day, extra) {
  const match = Object.assign({ day: { $gte: day } }, extra || {});
  const r = await UserDay.aggregate([{ $match: match }, { $group: { _id: '$uid' } }, { $count: 'n' }]);
  return r[0] ? r[0].n : 0;
}

function titleOf(doc) {
  if (!doc) return '';
  const t = doc.title || (doc.titles && doc.titles.en);
  if (typeof t === 'string') return t;
  if (t && typeof t.en === 'string') return t.en;
  return '';
}

async function getReport() {
  const today = dayKey(new Date());
  const d7 = addDays(today, -6);
  const d30 = addDays(today, -29);

  const [dau, wau, mau, engaged7, users, firstRow] = await Promise.all([
    UserDay.countDocuments({ day: today }),
    distinctSince(d7),
    distinctSince(d30),
    distinctSince(d7, { engaged: true }),
    UserDay.aggregate([{ $group: { _id: '$uid', first: { $min: '$day' }, days: { $push: '$day' } } }]),
    UserDay.findOne().sort({ day: 1 }).select('day').lean()
  ]);

  const [lessons7, learners7, quizAttempts7, quizScore, topRaw] = await Promise.all([
    LearningEvent.countDocuments({ type: 'lesson_completed', day: { $gte: d7 } }),
    LearningEvent.aggregate([{ $match: { type: 'lesson_completed', day: { $gte: d7 } } }, { $group: { _id: '$uid' } }, { $count: 'n' }]),
    LearningEvent.countDocuments({ type: 'quiz_submitted', day: { $gte: d7 } }),
    LearningEvent.aggregate([
      { $match: { type: 'quiz_submitted', day: { $gte: d7 }, total: { $gt: 0 }, correct: { $type: 'number' } } },
      { $group: { _id: null, total: { $sum: '$total' }, correct: { $sum: '$correct' }, attempts: { $sum: 1 } } }
    ]),
    LearningEvent.aggregate([
      { $match: { type: 'lesson_completed', day: { $gte: d7 }, lessonId: { $exists: true } } },
      { $group: { _id: '$lessonId', n: { $sum: 1 }, learners: { $addToSet: '$uid' } } },
      { $project: { n: 1, learners: { $size: '$learners' } } },
      { $sort: { n: -1 } },
      { $limit: 8 }
    ])
  ]);

  let top = topRaw.map(function (t) { return { id: String(t._id), n: t.n, learners: t.learners, title: '' }; });
  try {
    const Lesson = mongoose.models.Lesson;
    if (Lesson && top.length) {
      const docs = await Lesson.find({ _id: { $in: top.map(function (t) { return t.id; }) } }).lean();
      const byId = new Map(docs.map(function (d) { return [String(d._id), titleOf(d)]; }));
      top = top.map(function (t) { return Object.assign(t, { title: byId.get(t.id) || '' }); });
    }
  } catch (e) { /* titles are a nice extra */ }

  return {
    today, since: firstRow ? firstRow.day : null,
    people: Object.assign({ dau, wau, mau, engaged7 }, summarize(users, today)),
    learning: {
      lessons7,
      learners7: learners7[0] ? learners7[0].n : 0,
      quizAttempts7,
      quizAvg: quizScore[0] && quizScore[0].total ? Math.round((100 * quizScore[0].correct) / quizScore[0].total) : null,
      top
    }
  };
}

module.exports = { recordActivity, logLearning, scoreFromResults, getReport, summarize, stableId, addDays, dayKey };
