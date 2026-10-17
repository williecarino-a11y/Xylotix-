const express = require('express');
const rateLimit = require('express-rate-limit');

const OnboardingProfile = require('../models/OnboardingProfile');
const UserProgress = require('../models/UserProgress');

const MINUTES = [5, 10, 15, 20];
const LEVELS = ['beginner', 'some', 'confident'];

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

module.exports = function createOnboardingRoutes({ requireAuth }) {
  const router = express.Router();

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, 'ONBOARDING_RATE_LIMITED', 'Too many attempts. Please wait a few minutes.')
  });

  /* Does this user need onboarding, and what did they choose? */
  router.get('/', requireAuth, async function (req, res) {
    try {
      const userId = req.authUser._id;
      const profile = await OnboardingProfile.findOne({ userId });

      let needed = false;
      if (!profile) {
        // Anyone who already has progress is an existing learner and is never interrupted
        const done = await UserProgress.countDocuments({ userId, completed: true });
        needed = done === 0;
      }

      return res.status(200).json({
        status: 'success',
        data: {
          needed,
          profile: profile && !profile.skipped
            ? { goal: profile.goal, dailyMinutes: profile.dailyMinutes, level: profile.level }
            : null
        }
      });
    } catch (error) {
      console.error('Onboarding load error:', error);
      return fail(res, 500, 'ONBOARDING_LOAD_FAILED', 'Unable to load your learning plan.');
    }
  });

  /* Save the answers */
  router.post('/', requireAuth, writeLimiter, async function (req, res) {
    try {
      const body = req.body || {};
      const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
      const dailyMinutes = Number(body.dailyMinutes);
      const level = typeof body.level === 'string' ? body.level : '';

      if (!/^[a-z_]{2,24}$/.test(goal)) return fail(res, 400, 'INVALID_GOAL', 'Choose a goal.');
      if (MINUTES.indexOf(dailyMinutes) === -1) return fail(res, 400, 'INVALID_MINUTES', 'Choose a daily time.');
      if (LEVELS.indexOf(level) === -1) return fail(res, 400, 'INVALID_LEVEL', 'Choose a level.');

      await OnboardingProfile.findOneAndUpdate(
        { userId: req.authUser._id },
        { $set: { goal, dailyMinutes, level, skipped: false, completedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Onboarding save error:', error);
      return fail(res, 500, 'ONBOARDING_SAVE_FAILED', 'Unable to save your learning plan.');
    }
  });

  /* "Skip for now": never ask again automatically (keeps any earlier answers) */
  router.post('/skip', requireAuth, writeLimiter, async function (req, res) {
    try {
      await OnboardingProfile.findOneAndUpdate(
        { userId: req.authUser._id },
        { $setOnInsert: { skipped: true, completedAt: new Date() } },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Onboarding skip error:', error);
      return fail(res, 500, 'ONBOARDING_SKIP_FAILED', 'Unable to skip right now.');
    }
  });

  return router;
};
