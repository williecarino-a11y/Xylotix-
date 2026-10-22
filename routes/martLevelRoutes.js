/**
 * Miimiid Mart levels: the level map and the level trips.
 * A level trip is a normal shopping trip (same buy, put back, scan and checkout routes),
 * started with the level's own budget, clock, day card and fake deals.
 * funCenterRoutes.js mounts this at /api/fun-center/levels.
 */
const express = require('express');
const MartLevelProgress = require('../models/MartLevelProgress');
const FunGameSession = require('../models/FunGameSession');
const FunGameProfile = require('../models/FunGameProfile');
const levels = require('../scripts/learningData/martLevels');
const { SCANS_PER_TRIP, publicTricks, getCartSkin } = require('../scripts/learningData/funCenter');

const SHOP_GAME_ID = 'weekly-shop';

async function loadProgressMap(userId, mongoSession) {
  const query = MartLevelProgress.find({ userId });
  if (mongoSession) query.session(mongoSession);
  const rows = await query.lean();
  const map = {};
  rows.forEach(row => { map[row.levelId] = { stars: row.stars, bestScore: row.bestScore, attempts: row.attempts }; });
  return map;
}

/**
 * Read-only: what this result is worth. Used by checkout BEFORE rewards are written.
 * Returns { bonusCoins, newStars, previousStars } (bonus only for stars you never had on this level).
 */
async function evaluateLevelResult({ userId, levelId, stars, mongoSession }) {
  const query = MartLevelProgress.findOne({ userId, levelId });
  if (mongoSession) query.session(mongoSession);
  const row = await query.lean();
  const previousStars = row ? row.stars : 0;
  const newStars = Math.max(0, stars - previousStars);
  return { previousStars, newStars, bonusCoins: newStars * levels.BONUS_COINS_PER_NEW_STAR };
}

/**
 * Writes the result and returns what the result screen needs (stars, unlock, next level).
 */
async function commitLevelResult({ userId, levelId, stars, score, mongoSession, previousStars }) {
  const level = levels.getMartLevel(levelId);
  if (!level) return null;
  const now = new Date();
  const update = {
    $max: { stars, bestScore: score },
    $inc: { attempts: 1 }
  };
  if (stars >= levels.UNLOCK_STARS && !(previousStars >= levels.UNLOCK_STARS)) {
    update.$set = { firstClearedAt: now };
  }
  const row = await MartLevelProgress.findOneAndUpdate(
    { userId, levelId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true, session: mongoSession }
  );
  const next = levels.nextLevelOf(level);
  const bestStars = row.stars;
  return {
    id: level.id,
    number: level.number,
    title: level.title,
    boss: !!level.boss,
    stars,
    bestStars,
    passed: stars >= levels.UNLOCK_STARS,
    unlockStars: levels.UNLOCK_STARS,
    justUnlocked: !!next && stars >= levels.UNLOCK_STARS && !(previousStars >= levels.UNLOCK_STARS),
    next: next ? { id: next.id, number: next.number, title: next.title, unlocked: bestStars >= levels.UNLOCK_STARS } : null,
    isLast: !next
  };
}

function createRouter({ requireFunCenterUser, funSessionStartLimiter, funAnswerLimiter, createSessionId }) {
  const router = express.Router();

  // The level map: every level, your stars, and which are open.
  router.get('/', funAnswerLimiter, async (req, res) => {
    try {
      const user = await requireFunCenterUser(req, res);
      if (!user) return;
      const progress = await loadProgressMap(user._id);
      const data = levels.getAllMartLevels().map(level =>
        levels.publicLevel(level, progress[level.id], levels.isLevelUnlocked(level, progress))
      );
      return res.json({ status: 'success', data: { levels: data, unlockStars: levels.UNLOCK_STARS, bonusPerStar: levels.BONUS_COINS_PER_NEW_STAR } });
    } catch (error) {
      console.error('Mart levels list error:', error);
      return res.status(500).json({ status: 'error', message: 'Unable to load the levels.' });
    }
  });

  // Starts a level trip. The level must be open for this player.
  router.post('/:levelId/start', funSessionStartLimiter, async (req, res) => {
    try {
      const user = await requireFunCenterUser(req, res);
      if (!user) return;
      const level = levels.getMartLevel(req.params.levelId);
      if (!level) return res.status(404).json({ status: 'error', message: 'That level does not exist.' });

      const progress = await loadProgressMap(user._id);
      if (!levels.isLevelUnlocked(level, progress)) {
        return res.status(403).json({ status: 'error', code: 'LEVEL_LOCKED', message: `Earn ${levels.UNLOCK_STARS} stars on the level before this one to open it.` });
      }

      const tricks = levels.pickLevelTricks(level);
      const profile = await FunGameProfile.findOne({ userId: user._id }).lean();
      const skin = profile && profile.cartSkin ? getCartSkin(profile.cartSkin) : null;
      const session = await FunGameSession.create({
        sessionId: createSessionId(),
        userId: user._id,
        gameId: SHOP_GAME_ID,
        budget: level.budget,
        situationId: null,
        levelId: level.id,
        tricks,
        scansLeft: typeof level.scans === 'number' ? level.scans : SCANS_PER_TRIP
      });

      return res.status(201).json({
        status: 'success',
        data: {
          sessionId: session.sessionId,
          gameId: SHOP_GAME_ID,
          budget: level.budget,
          spent: 0,
          remaining: level.budget,
          closingSeconds: level.closingSeconds,
          week: levels.getLevelWeekSetup(level),
          tricks: publicTricks(tricks),
          scansLeft: session.scansLeft,
          scenario: null,
          level: { id: level.id, number: level.number, title: level.title, boss: !!level.boss },
          cartSkin: skin ? { id: skin.id, color: skin.color, rainbow: !!skin.rainbow } : null
        }
      });
    } catch (error) {
      console.error('Mart level start error:', error);
      return res.status(500).json({ status: 'error', message: 'Unable to start the level.' });
    }
  });

  return router;
}

module.exports = { createRouter, evaluateLevelResult, commitLevelResult };
