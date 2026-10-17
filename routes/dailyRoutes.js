const express = require('express');
const rateLimit = require('express-rate-limit');

const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const OnboardingProfile = require('../models/OnboardingProfile');
const streakService = require('../services/streakService');

const MINUTES = [5, 10, 15, 20];

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

module.exports = function createDailyRoutes({ requireAuth }) {
  const router = express.Router();

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, 'DAILY_RATE_LIMITED', 'Too many attempts. Please wait a few minutes.')
  });

  /* Today's goal, the streak and the freezes */
  router.get('/', requireAuth, async function (req, res) {
    try {
      const userId = req.authUser._id;
      const result = await streakService.evaluate(userId, req.query.tz);

      const profile = await OnboardingProfile.findOne({ userId }).select('dailyMinutes');
      const dailyMinutes = profile && MINUTES.indexOf(profile.dailyMinutes) !== -1 ? profile.dailyMinutes : 10;

      const since = new Date(Date.now() - 40 * 3600 * 1000);
      const recent = await UserProgress.find({
        userId, completed: true, completedAt: { $gte: since }
      }).select('lessonId completedAt');

      const todays = recent.filter(function (p) {
        return streakService.keyIn(p.completedAt, result.tz) === result.today;
      });

      let minutesToday = 0;
      if (todays.length) {
        const lessons = await Lesson.find({ _id: { $in: todays.map(function (p) { return p.lessonId; }) } })
          .select('estimatedDuration');
        minutesToday = lessons.reduce(function (t, l) { return t + (Number(l.estimatedDuration) || 0); }, 0);
      }

      const notices = await streakService.consumeNotices(userId);

      return res.status(200).json({
        status: 'success',
        data: {
          dailyMinutes,
          minutesToday,
          goalMet: minutesToday >= dailyMinutes,
          streak: result.streak,
          freezes: result.freezes,
          maxFreezes: streakService.MAX_FREEZES,
          learnedToday: result.learnedToday,
          freezeUsed: notices.freezeUsed,
          freezeEarned: notices.freezeEarned
        }
      });
    } catch (error) {
      console.error('Daily goal load error:', error);
      return fail(res, 500, 'DAILY_LOAD_FAILED', 'Unable to load your daily goal.');
    }
  });

  /* Change the daily goal */
  router.post('/goal', requireAuth, writeLimiter, async function (req, res) {
    try {
      const minutes = Number(req.body && req.body.dailyMinutes);
      if (MINUTES.indexOf(minutes) === -1) return fail(res, 400, 'INVALID_MINUTES', 'Choose a daily time from the list.');

      await OnboardingProfile.findOneAndUpdate(
        { userId: req.authUser._id },
        {
          $set: { dailyMinutes: minutes },
          $setOnInsert: { goal: 'learn', level: 'beginner', skipped: true, completedAt: new Date() }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({ status: 'success', data: { dailyMinutes: minutes } });
    } catch (error) {
      console.error('Daily goal save error:', error);
      return fail(res, 500, 'DAILY_SAVE_FAILED', 'Unable to save your daily goal.');
    }
  });

  return router;
};
