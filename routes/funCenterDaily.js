/*
 * Miimiid Mart: Daily Challenge (server).
 * Everyone gets the same situation, shelf tricks and event items on a given UTC day.
 * The server owns the day, the one-attempt rule and the score. The browser only displays them.
 */
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const { getAuthenticatedUser } = require('./authRoutes');
const FunGameSession = require('../models/FunGameSession');
const FunGameProfile = require('../models/FunGameProfile');
const FunDailyAttempt = require('../models/FunDailyAttempt');
const User = require('../models/User');
const FunNickname = require('../models/FunNickname');
const { getWeeklyShopDefinition, getWeekSetup, pickSituation, pickTricks, publicTricks, SCANS_PER_TRIP, getCartSkin } = require('../scripts/learningData/funCenter');

const router = express.Router();
const SHOP_GAME_ID = 'weekly-shop';

const dailyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ status: 'error', code: 'FUN_RATE_LIMITED', message: 'Too many requests. Please wait a moment.' })
});

// ---- seeded randomness: same day, same picks ----
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function makeRng(seed) {
  let a = xmur3(seed)();
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks one entry from a list. On a daily trip the same entry wins for everyone; otherwise it is random.
function pickFor(dayKey, salt, list, keyOf) {
  if (!dayKey) return list[Math.floor(Math.random() * list.length)];
  return list.slice().sort((a, b) => xmur3(`${dayKey}:${salt}:${keyOf(a)}`)() - xmur3(`${dayKey}:${salt}:${keyOf(b)}`)())[0];
}

// ---- days and streaks ----
function todayKey() { return new Date().toISOString().slice(0, 10); }

function shiftDay(key, delta) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

async function computeStreak(userId, dayKey, mongoSession) {
  const query = FunDailyAttempt.find({ userId, status: 'completed' }).sort({ dayKey: -1 }).limit(90).select('dayKey').lean();
  if (mongoSession) query.session(mongoSession);
  const have = new Set((await query).map(row => row.dayKey));
  let cursor = have.has(dayKey) ? dayKey : shiftDay(dayKey, -1);   // still alive if you played yesterday
  let streak = 0;
  while (have.has(cursor)) { streak++; cursor = shiftDay(cursor, -1); }
  return streak;
}

// ---- the daily score (decided here, never by the browser) ----
function dailyBreakdown(summary) {
  const tricks = Array.isArray(summary.tricks) ? summary.tricks : [];
  const caught = tricks.filter(t => t.status === 'busted' || t.status === 'knew').length;
  const fell = tricks.filter(t => t.status === 'fell').length;
  const burned = Array.isArray(summary.burnedOut) && summary.burnedOut.length > 0;
  const rows = [
    { label: `Stars (${summary.stars} of 3)`, points: summary.stars * 250 },
    { label: `Needs covered (${summary.needsBought.length} of ${summary.totalNeeds})`, points: summary.needsBought.length * 40 },
    { label: `Money kept ($${summary.saved})`, points: summary.saved * 8 }
  ];
  if (caught > 0) rows.push({ label: `Fake deals caught (${caught})`, points: caught * 40 });
  if (fell > 0) rows.push({ label: `Fell for fakes (${fell})`, points: -fell * 30 });
  if (burned) rows.push({ label: 'Burned out (a meter hit zero)', points: -150 });
  const sum = rows.reduce((total, row) => total + row.points, 0);
  return { rows, total: Math.max(0, Math.round(sum)) };
}

function dailyScore(summary) {
  return dailyBreakdown(summary).total;
}

// Called from the checkout route, inside its transaction.
async function finishAttempt({ userId, dayKey, sessionId, summary, mongoSession }) {
  const breakdown = dailyBreakdown(summary);
  const score = breakdown.total;
  const attempt = await FunDailyAttempt.findOneAndUpdate(
    { userId, dayKey, sessionId, status: 'started' },
    {
      $set: {
        status: 'completed', score, stars: summary.stars, spent: summary.spent, saved: summary.saved,
        needsCovered: summary.needsBought.length, totalNeeds: summary.totalNeeds, completedAt: new Date()
      }
    },
    { new: true, session: mongoSession }
  );
  if (!attempt) return null;
  const streak = await computeStreak(userId, dayKey, mongoSession);
  return { dayKey, score, stars: summary.stars, streak };
}

async function requireUser(req, res) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Authentication required.' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('Daily challenge authentication error:', error);
    res.status(500).json({ status: 'error', message: 'Unable to verify authentication.' });
    return null;
  }
}

async function sessionPayload(session, userId) {
  const shop = getWeeklyShopDefinition();
  const profile = await FunGameProfile.findOne({ userId }).lean();
  const skin = profile && profile.cartSkin ? getCartSkin(profile.cartSkin) : null;
  const spent = session.spent || 0;
  return {
    sessionId: session.sessionId,
    gameId: SHOP_GAME_ID,
    budget: shop.budget,
    spent,
    remaining: Math.max(0, shop.budget - spent),
    week: getWeekSetup(session.situationId),
    tricks: publicTricks(session.tricks),
    scansLeft: session.scansLeft || 0,
    cartSkin: skin ? { id: skin.id, color: skin.color, rainbow: !!skin.rainbow } : null,
    daily: true
  };
}

// Today's status for this player: the day's situation, whether they can still play, their score and streak.
router.get('/', dailyLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const dayKey = todayKey();
    const attempt = await FunDailyAttempt.findOne({ userId: user._id, dayKey }).lean();
    const situation = pickSituation(makeRng(`${dayKey}:situation`));
    const done = !!attempt && attempt.status === 'completed';
    let locked = done;
    if (attempt && !done) {
      const prev = await FunGameSession.findOne({ sessionId: attempt.sessionId, userId: user._id }).lean();
      locked = !(prev && !prev.completed && (!prev.purchasedItems || prev.purchasedItems.length === 0));
    }
    return res.json({
      status: 'success',
      data: {
        dayKey,
        situation: { title: situation.title, story: situation.story },
        locked,
        result: done ? { score: attempt.score, stars: attempt.stars, spent: attempt.spent, saved: attempt.saved, needsCovered: attempt.needsCovered, totalNeeds: attempt.totalNeeds } : null,
        streak: await computeStreak(user._id, dayKey),
        nickname: ((await FunNickname.findOne({ userId: user._id }).lean()) || {}).nickname || ''
        }
    });
  } catch (error) {
    console.error('Daily challenge status error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load the daily challenge.' });
  }
});

// Starts today's trip (one scored attempt per day). Returns the same shape as /shop/session.
router.post('/start', dailyLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const dayKey = todayKey();
    const shop = getWeeklyShopDefinition();
    const played = () => res.status(409).json({ status: 'error', code: 'ALREADY_PLAYED', message: "You already played today's challenge. Come back tomorrow!" });

    const prior = await FunDailyAttempt.findOne({ userId: user._id, dayKey });
    if (prior) {
      if (prior.status === 'completed') return played();
      const prev = await FunGameSession.findOne({ sessionId: prior.sessionId, userId: user._id });
      // an empty-cart trip can be resumed (a crash or a quick exit does not burn the attempt)
      if (prev && !prev.completed && (!prev.purchasedItems || prev.purchasedItems.length === 0)) {
        return res.json({ status: 'success', data: await sessionPayload(prev, user._id) });
      }
      return played();
    }

    const sessionId = crypto.randomUUID();
    try {
      await FunDailyAttempt.create({ userId: user._id, dayKey, sessionId });
    } catch (error) {
      if (error && error.code === 11000) return played();
      throw error;
    }

    let session;
    try {
      const situation = pickSituation(makeRng(`${dayKey}:situation`));
      const tricks = pickTricks(makeRng(`${dayKey}:tricks`));
      session = await FunGameSession.create({
        sessionId, userId: user._id, gameId: SHOP_GAME_ID, budget: shop.budget,
        situationId: situation.id, tricks, scansLeft: SCANS_PER_TRIP, dailyKey: dayKey
      });
    } catch (error) {
      await FunDailyAttempt.deleteOne({ userId: user._id, dayKey, sessionId }).catch(() => {});
      throw error;
    }
    return res.status(201).json({ status: 'success', data: await sessionPayload(session, user._id) });
  } catch (error) {
    console.error('Daily challenge start error:', error);
    return res.status(500).json({ status: 'error', message: "Unable to start today's challenge." });
  }
});

function displayName(u, id) {
  const first = u && u.firstName ? String(u.firstName).trim() : '';
  const last = u && u.lastName ? String(u.lastName).trim() : '';
  if (!first) return `Player ${String(id).slice(-4).toUpperCase()}`;
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

// Today's top 10 and this player's rank. Ties go to whoever finished first.
router.get('/leaderboard', dailyLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const dayKey = todayKey();
    const filter = { dayKey, status: 'completed' };
    const [rows, total, mine] = await Promise.all([
      FunDailyAttempt.find(filter).sort({ score: -1, completedAt: 1 }).limit(10).lean(),
      FunDailyAttempt.countDocuments(filter),
      FunDailyAttempt.findOne({ ...filter, userId: user._id }).lean()
    ]);
    const users = await User.find({ _id: { $in: rows.map(r => r.userId) } }).select('firstName lastName').lean();
    const byId = new Map(users.map(u => [String(u._id), u]));
    const nicks = await FunNickname.find({ userId: { $in: rows.map(r => r.userId) } }).lean();
    const nickById = new Map(nicks.map(n => [String(n.userId), n.nickname]));
    const top = rows.map((row, i) => ({
      rank: i + 1,
      name: nickById.get(String(row.userId)) || displayName(byId.get(String(row.userId)), row.userId),
      score: row.score,
      stars: row.stars,
      you: String(row.userId) === String(user._id)
    }));
    let you = null;
    if (mine) {
      const ahead = await FunDailyAttempt.countDocuments({
        ...filter,
        $or: [{ score: { $gt: mine.score } }, { score: mine.score, completedAt: { $lt: mine.completedAt } }]
      });
      you = { rank: ahead + 1, score: mine.score, stars: mine.stars };
    }
    return res.json({ status: 'success', data: { dayKey, total, top, you } });
  } catch (error) {
    console.error('Daily leaderboard error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load the leaderboard.' });
  }
});

// ---- nicknames ----
const BLOCKED_WORDS = ['fuck', 'shit', 'bitch', 'dick', 'cunt', 'nigg', 'fag', 'rape', 'nazi', 'porn', 'sex', 'slut', 'whore', 'pussy', 'cock'];
const RESERVED_WORDS = ['admin', 'miimiid', 'moderator', 'support', 'official', 'staff'];

function flatten(text) {
  return text.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/[^a-z]/g, '');
}

function cleanNickname(raw) {
  const nick = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (nick.length < 3 || nick.length > 16) return { error: 'Use 3 to 16 characters.' };
  if (!/^[A-Za-z0-9 _-]+$/.test(nick)) return { error: 'Use only letters, numbers, spaces, - and _.' };
  const flat = flatten(nick);
  if (BLOCKED_WORDS.some(w => flat.includes(w)) || RESERVED_WORDS.some(w => flat.includes(w))) {
    return { error: 'Please pick a different name.' };
  }
  return { nick };
}

router.post('/nickname', dailyLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const checked = cleanNickname(req.body && req.body.nickname);
    if (checked.error) return res.status(400).json({ status: 'error', message: checked.error });
    try {
      await FunNickname.findOneAndUpdate(
        { userId: user._id },
        { $set: { nickname: checked.nick, nicknameLower: checked.nick.toLowerCase() } },
        { upsert: true, new: true, runValidators: true }
      );
    } catch (error) {
      if (error && error.code === 11000) {
        return res.status(409).json({ status: 'error', code: 'NAME_TAKEN', message: 'That name is taken. Try another.' });
      }
      throw error;
    }
    return res.json({ status: 'success', data: { nickname: checked.nick } });
  } catch (error) {
    console.error('Daily nickname error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to save your name.' });
  }
});

module.exports = { router, pickFor, finishAttempt };
