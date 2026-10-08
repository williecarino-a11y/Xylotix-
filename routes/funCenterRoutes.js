const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const { getAuthenticatedUser } = require('./authRoutes');
const FunGameSession = require('../models/FunGameSession');
const FunGameProfile = require('../models/FunGameProfile');
const { getFunCenterGames, getFunCenterGame, validateFunCenterAnswer, getWeeklyShop, getWeeklyShopDefinition, getFlashSales, getPriceHikes, getWeekSetup, pickSituation, computeMeters, METER_WARN, pickTricks, publicTricks, describeTrick, SCANS_PER_TRIP } = require('../scripts/learningData/funCenter');
const router = express.Router();

const funSessionStartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ status: 'error', code: 'FUN_RATE_LIMITED', message: 'Too many game sessions started. Please wait a few minutes and try again.' })
});

const funAnswerLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ status: 'error', code: 'FUN_RATE_LIMITED', message: 'Too many answers submitted. Please slow down and try again.' })
});

function createSessionId() {
  return crypto.randomUUID();
}

function calculateReward(correctAnswers, totalRounds) {
  const percentage = totalRounds > 0 ? correctAnswers / totalRounds : 0;
  return { xp: 25 + Math.round(percentage * 75), coins: 5 + Math.round(percentage * 20) };
}

function calculateComboBonus(combo) {
  if (combo >= 8) return 50;
  if (combo >= 5) return 25;
  if (combo >= 3) return 10;
  return 0;
}

async function requireFunCenterUser(req, res) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Authentication required.' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('Fun Center authentication error:', error);
    res.status(500).json({ status: 'error', message: 'Unable to verify authentication.' });
    return null;
  }
}

router.get('/games', async (req, res) => {
  try {
    const games = getFunCenterGames();
    const safeGames = games.map(game => ({
      id: game.id,
      type: game.type,
      title: game.title,
      subtitle: game.subtitle,
      resultTitle: game.resultTitle,
      resultMessage: game.resultMessage,
      answers: game.answers.map(answer => ({ id: answer.id, label: answer.label })),
      rounds: game.rounds.map(round => ({
        id: round.id,
        prompt: round.prompt,
        category: round.category,
        visual: round.visual,
        image: round.image,
        price: round.price,
        difficulty: round.difficulty,
        choices: round.choices ? round.choices.map(choice => ({ id: choice.id, label: choice.label })) : undefined
      }))
    }));
    return res.json({ status: 'success', data: safeGames });
  } catch (error) {
    console.error('Fun Center games error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load Fun Center games.' });
  }
});

router.post('/session', funSessionStartLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ status: 'error', message: 'gameId is required.' });
    const game = getFunCenterGame(gameId);
    if (!game) return res.status(404).json({ status: 'error', message: 'Fun Center game not found.' });
    const session = await FunGameSession.create({ sessionId: createSessionId(), userId: user._id, gameId });
    return res.status(201).json({ status: 'success', data: { sessionId: session.sessionId, gameId: session.gameId, totalRounds: game.rounds.length } });
  } catch (error) {
    console.error('Fun Center session error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start Fun Center game.' });
  }
});

router.post('/session/:sessionId/answer', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;
    const { sessionId } = req.params;
    const { roundIndex, answer } = req.body;
    const session = await FunGameSession.findOne({ sessionId, userId: user._id });
    if (!session) return res.status(404).json({ status: 'error', message: 'Game session not found.' });
    if (session.completed) return res.status(409).json({ status: 'error', message: 'Game session is already completed.' });
    const game = getFunCenterGame(session.gameId);
    if (!game) return res.status(404).json({ status: 'error', message: 'Game definition not found.' });
    if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= game.rounds.length) return res.status(400).json({ status: 'error', message: 'Invalid round.' });
    if (roundIndex !== session.roundsCompleted) return res.status(409).json({ status: 'error', message: 'Invalid game progression.' });

    const correct = validateFunCenterAnswer(session.gameId, roundIndex, answer);
    const newCombo = correct ? (session.currentCombo || 0) + 1 : 0;
    const comboBonus = correct ? calculateComboBonus(newCombo) : 0;
    const newMaxCombo = Math.max(session.maxCombo || 0, newCombo);
    const update = {
      $inc: {
        roundsCompleted: 1,
        ...(correct ? { correctAnswers: 1, score: 100 + comboBonus } : {})
      },
      $set: { currentCombo: newCombo, maxCombo: newMaxCombo }
    };

    // The progression check is repeated inside the write so two concurrent
    // requests cannot both claim the same round between read and save.
    const updatedSession = await FunGameSession.findOneAndUpdate(
      {
        sessionId,
        userId: user._id,
        completed: false,
        roundsCompleted: roundIndex
      },
      update,
      { new: true, runValidators: true }
    );

    if (!updatedSession) {
      return res.status(409).json({ status: 'error', message: 'Invalid or already submitted game round.' });
    }
const answeredRound = game.rounds[roundIndex];
    return res.json({
      status: 'success',
      data: {
        correct,
        score: updatedSession.score,
        correctAnswers: updatedSession.correctAnswers,
        combo: updatedSession.currentCombo,
        maxCombo: updatedSession.maxCombo,
        comboBonus,
        roundsCompleted: updatedSession.roundsCompleted,
        totalRounds: game.rounds.length,
        complete: updatedSession.roundsCompleted >= game.rounds.length,
        correctAnswer: answeredRound.answer,
        explanation: answeredRound.explanation || ''
      }
    });
  } catch (error) {
    console.error('Fun Center answer error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to process game answer.' });
  }
});

router.post('/session/:sessionId/complete', funSessionStartLimiter, async (req, res) => {
  const mongoSession = await mongoose.startSession();
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) {
      await mongoSession.endSession();
      return;
    }

    const { sessionId } = req.params;
    let completionResult = null;

    await mongoSession.withTransaction(async () => {
      const existingSession = await FunGameSession.findOne({ sessionId, userId: user._id }).session(mongoSession);
      if (!existingSession) { const error = new Error('Game session not found.'); error.code = 'SESSION_NOT_FOUND'; throw error; }

      const game = getFunCenterGame(existingSession.gameId);
      if (!game) { const error = new Error('Game definition not found.'); error.code = 'GAME_NOT_FOUND'; throw error; }
      if (existingSession.roundsCompleted < game.rounds.length) { const error = new Error('Game has not been completed.'); error.code = 'GAME_NOT_COMPLETED'; throw error; }

      const reward = calculateReward(existingSession.correctAnswers, game.rounds.length);
      const claimedSession = await FunGameSession.findOneAndUpdate(
        { sessionId, userId: user._id, completed: false, rewardGranted: false, roundsCompleted: { $gte: game.rounds.length } },
        { $set: { completed: true, rewardGranted: true, xpAwarded: reward.xp, coinsAwarded: reward.coins, completedAt: new Date() } },
        { new: true, session: mongoSession }
      );

      if (!claimedSession) {
        const alreadyCompleted = await FunGameSession.findOne({ sessionId, userId: user._id }).session(mongoSession);
        if (alreadyCompleted && alreadyCompleted.completed && alreadyCompleted.rewardGranted) {
          completionResult = { alreadyCompleted: true, score: alreadyCompleted.score, correctAnswers: alreadyCompleted.correctAnswers, totalRounds: game.rounds.length, xp: alreadyCompleted.xpAwarded, coins: alreadyCompleted.coinsAwarded };
          return;
        }
        const error = new Error('Game completion could not be claimed.'); error.code = 'SESSION_CLAIM_FAILED'; throw error;
      }

      const profile = await FunGameProfile.findOneAndUpdate(
        { userId: user._id },
        { $inc: { totalXP: reward.xp, totalCoins: reward.coins, gamesPlayed: 1, gamesCompleted: 1, totalRoundsPlayed: claimedSession.roundsCompleted } },
        { upsert: true, new: true, session: mongoSession, setDefaultsOnInsert: true }
      );

      const currentBest = profile.bestScores && typeof profile.bestScores.get === 'function' ? profile.bestScores.get(claimedSession.gameId) : null;
      if (currentBest === undefined || currentBest === null || claimedSession.score > currentBest) {
        profile.bestScores.set(claimedSession.gameId, claimedSession.score);
        await profile.save({ session: mongoSession });
      }

      completionResult = { alreadyCompleted: false, score: claimedSession.score, correctAnswers: claimedSession.correctAnswers, totalRounds: game.rounds.length, xp: reward.xp, coins: reward.coins, totalXP: profile.totalXP, totalCoins: profile.totalCoins };
    });

    return res.json({ status: 'success', data: completionResult });
  } catch (error) {
    if (error.code === 'SESSION_NOT_FOUND') return res.status(404).json({ status: 'error', message: 'Game session not found.' });
    if (error.code === 'GAME_NOT_FOUND') return res.status(404).json({ status: 'error', message: 'Game definition not found.' });
    if (error.code === 'GAME_NOT_COMPLETED') return res.status(409).json({ status: 'error', message: 'Game has not been completed.' });
    if (error.code === 'SESSION_CLAIM_FAILED') return res.status(409).json({ status: 'error', message: 'Game completion could not be claimed.' });
    console.error('Fun Center completion error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to complete Fun Center game.' });
  } finally {
    await mongoSession.endSession();
  }
});

/* =========================================================
 * WEEKLY SHOP (server-authoritative budget)
 * ========================================================= */

const RIVAL_ITEMS = ['pasta', 'apple', 'carrot', 'water', 'medicine'];   // essentials a rival can race you for
const RIVAL_SECONDS = 14;          // time until the rival reaches the shelf
const RIVAL_RESTOCK_SECONDS = 20;  // how long it stays sold out
const RIVAL_MARKUP = 2;            // extra price when it comes back
const SHOP_GAME_ID = 'weekly-shop';
const STAR_SAVE_TARGET = 5;   // money to keep for the savings star

function buildShopSummary(shop, session) {
  const bought = Array.isArray(session.purchasedItems) ? session.purchasedItems : [];
  const boughtIds = new Set(bought.map(entry => entry.itemId));
  const byId = new Map(shop.items.map(item => [item.id, item]));
  const findOption = (item, optionId) =>
    optionId && Array.isArray(item.options) ? item.options.find(candidate => candidate.id === optionId) : null;

  const toPublic = entry => {
    const item = byId.get(entry.itemId || entry.id);
    const option = findOption(item, entry.optionId);
    return {
      id: item.id,
      name: option ? `${item.name} (${option.label})` : item.name,
      price: typeof entry.price === 'number' ? entry.price : item.price,
      image: item.image,
      visual: item.visual
    };
  };

  const totalNeeds = shop.items.filter(item => item.classification === 'need');
  const needsBought = bought.filter(entry => entry.classification === 'need');
  const wantsBought = bought.filter(entry => entry.classification === 'want');
  const needsMissed = totalNeeds.filter(item => !boughtIds.has(item.id));

  const tradeoffs = bought
    .map(entry => {
      const item = byId.get(entry.itemId);
      const option = item ? findOption(item, entry.optionId) : null;
      if (!item || !option) return null;
      const prices = item.options.map(candidate => candidate.price);
      const top = item.options.reduce((a, b) => (b.price > a.price ? b : a));
      return {
        name: item.name,
        label: option.label,
        price: entry.price,
        saved: Math.max(0, Math.max(...prices) - entry.price),
        extra: Math.max(0, entry.price - Math.min(...prices)),
        topLabel: top.label
      };
    })
    .filter(Boolean);

  const spent = session.spent || 0;
  const wantsSpent = wantsBought.reduce((sum, entry) => sum + entry.price, 0);
  const needsSpent = spent - wantsSpent;
  const saved = Math.max(0, shop.budget - spent);
  const score = Math.max(0, needsBought.length * 100 + saved * 5 - wantsSpent * 5);

  // Star rating: one star per goal. Everything is decided here, on the server.
  const premiumBought = bought.filter(entry => {
    const item = byId.get(entry.itemId);
    const option = item ? findOption(item, entry.optionId) : null;
    return !!option && option.tier === 'premium';
  }).length;
  const allNeeds = needsMissed.length === 0;
  const starRows = [
    {
      id: 'needs',
      label: 'Every need covered',
      earned: allNeeds,
      hint: `${needsMissed.length} still missing from your list`
    },
    {
      id: 'save',
      label: `Kept at least $${STAR_SAVE_TARGET}`,
      earned: allNeeds && saved >= STAR_SAVE_TARGET,
      hint: allNeeds ? `You kept $${saved}. Store brands help.` : 'Cover every need first'
    },
    {
      id: 'smart',
      label: 'Smart choices',
      earned: allNeeds && wantsBought.length === 0 && premiumBought === 0,
      hint: !allNeeds ? 'Cover every need first' : wantsBought.length > 0 ? 'You bought a want' : 'You paid extra for a premium option'
    }
  ];
  // Survive the Week: with a day card, the stars come from the three meters.
  let finalRows = starRows;
  let meters = null;
  let burnedOut = [];
  let burnMessage = '';
  if (session.situationId) {
    meters = computeMeters(session.situationId, bought.map(entry => entry.itemId));
    if (meters) {
      const names = { health: 'Health', happiness: 'Happiness', friends: 'Friends' };
      burnedOut = Object.keys(names).filter(key => meters[key] <= 0);
      const weakest = Object.keys(names).reduce((a, b) => (meters[b] < meters[a] ? b : a));
      finalRows = [
        { id: 'survive', label: 'Survived the day', earned: burnedOut.length === 0, hint: `Your ${burnedOut.map(k => names[k]).join(' and ')} meter hit zero` },
        { id: 'balance', label: `Every meter at ${METER_WARN} or more`, earned: meters[weakest] >= METER_WARN, hint: `${names[weakest]} is still low (${meters[weakest]})` },
        { id: 'save', label: `Kept at least $${STAR_SAVE_TARGET}`, earned: burnedOut.length === 0 && saved >= STAR_SAVE_TARGET, hint: burnedOut.length ? 'Survive the day first' : `You kept $${saved}` }
      ];
      if (burnedOut.length) {
        burnMessage = `You burned out: ${burnedOut.map(k => names[k]).join(' and ')} hit zero. Balance beats buying only one kind of thing.`;
      }
    }
  }
  const stars = finalRows.filter(row => row.earned).length;

  let outcome = 'missing-essentials';
  let message = 'Many essentials are still missing. Next time, cover your needs first.';
  if (needsMissed.length === 0 && saved > 0) {
    outcome = 'smart-shopper';
    message = 'Smart Shopper! You covered every essential and kept some money back.';
  } else if (needsMissed.length === 0) {
    outcome = 'almost-there';
    message = 'Every essential covered, but you spent your last dollars on wants. Keep some savings next time!';
  } else if (wantsSpent > 0 && wantsSpent >= needsSpent) {
    outcome = 'too-many-wants';
    message = 'Your wants cost more than your needs this week. Essentials come first.';
  } else if (needsMissed.length <= 2) {
    outcome = 'almost-there';
    message = 'Almost there! You missed a couple of essentials.';
  }

  return {
    outcome: burnedOut.length ? 'burned-out' : outcome,
    message: burnMessage || (meters
      ? ({
          3: 'Perfect balance! Every part of your life is covered and you still have savings.',
          2: 'Nearly there! One goal slipped. Check which star is missing.',
          1: 'You got through the day, but a meter or your savings ran short.'
        })[stars] || message
      : message),
    budget: shop.budget,
    spent,
    saved,
    wantsSpent,
    score,
    stars,
    starRows: finalRows,
    meters,
    burnedOut,
    situationId: session.situationId || null,
    totalNeeds: totalNeeds.length,
    needsBought: needsBought.map(toPublic),
    wantsBought: wantsBought.map(toPublic),
    needsMissed: needsMissed.map(item => ({ id: item.id, name: item.name, price: (session.hikeItemId === item.id && typeof session.hikePrice === 'number') ? session.hikePrice : item.price, image: item.image, visual: item.visual, explanation: item.explanation })),
    tradeoffs
  };
}

router.get('/shop', (req, res) => {
  try {
    return res.json({ status: 'success', data: getWeeklyShop() });
  } catch (error) {
    console.error('Fun Center shop error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load the shop.' });
  }
});

router.post('/shop/session/:sessionId/unbuy', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const { itemId } = req.body;
    const shop = getWeeklyShopDefinition();
    const item = shop.items.find(candidate => candidate.id === itemId);
    if (!item) return res.status(400).json({ status: 'error', message: 'That item is not in the shop.' });

    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });

    const entry = existing.purchasedItems.find(candidate => candidate.itemId === item.id);
    if (!entry) return res.status(409).json({ status: 'error', code: 'NOT_IN_BASKET', message: `${item.name} is not in your basket.` });

    // The stored price is removed in one atomic write, so a double tap cannot refund twice.
    const updated = await FunGameSession.findOneAndUpdate(
      {
        sessionId,
        userId: user._id,
        gameId: SHOP_GAME_ID,
        completed: false,
        purchasedItems: { $elemMatch: { itemId: item.id, price: entry.price } }
      },
      {
        $inc: { spent: -entry.price },
        $pull: { purchasedItems: { itemId: item.id } }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ status: 'error', code: 'BASKET_CHANGED', message: 'Your basket just changed. Try again.' });
    }

    return res.json({
      status: 'success',
      data: {
        itemId: item.id,
        name: item.name,
        price: entry.price,
        budget: shop.budget,
        spent: updated.spent,
        remaining: Math.max(0, shop.budget - updated.spent),
        basketCount: updated.purchasedItems.length
      }
    });
  } catch (error) {
    console.error('Fun Center shop unbuy error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to put that item back.' });
  }
});

router.post('/shop/session/:sessionId/unbuy', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const { itemId } = req.body;
    const shop = getWeeklyShopDefinition();
    const item = shop.items.find(candidate => candidate.id === itemId);
    if (!item) return res.status(400).json({ status: 'error', message: 'That item is not in the shop.' });

    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });

    const entry = existing.purchasedItems.find(candidate => candidate.itemId === item.id);
    if (!entry) return res.status(409).json({ status: 'error', code: 'NOT_IN_BASKET', message: `${item.name} is not in your basket.` });

    // The stored price is removed in one atomic write, so a double tap cannot refund twice.
    const updated = await FunGameSession.findOneAndUpdate(
      {
        sessionId,
        userId: user._id,
        gameId: SHOP_GAME_ID,
        completed: false,
        purchasedItems: { $elemMatch: { itemId: item.id, price: entry.price } }
      },
      {
        $inc: { spent: -entry.price },
        $pull: { purchasedItems: { itemId: item.id } }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ status: 'error', code: 'BASKET_CHANGED', message: 'Your basket just changed. Try again.' });
    }

    return res.json({
      status: 'success',
      data: {
        itemId: item.id,
        name: item.name,
        price: entry.price,
        budget: shop.budget,
        spent: updated.spent,
        remaining: Math.max(0, shop.budget - updated.spent),
        basketCount: updated.purchasedItems.length
      }
    });
  } catch (error) {
    console.error('Fun Center shop unbuy error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to put that item back.' });
  }
});

// Starts the flash sale for this trip (once). The server picks the item and the end time.
router.post('/shop/session/:sessionId/sale/start', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const shop = getWeeklyShopDefinition();
    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });
    if (existing.saleItemId) return res.json({ status: 'success', data: { started: false } });

    const boughtIds = new Set(existing.purchasedItems.map(entry => entry.itemId));
    const choices = getFlashSales().filter(sale => !boughtIds.has(sale.itemId) && shop.items.some(item => item.id === sale.itemId));
    if (choices.length === 0) return res.json({ status: 'success', data: { started: false } });

    const sale = choices[Math.floor(Math.random() * choices.length)];
    const item = shop.items.find(candidate => candidate.id === sale.itemId);
    const endsAt = new Date(Date.now() + sale.seconds * 1000);

    const updated = await FunGameSession.findOneAndUpdate(
      { sessionId, userId: user._id, gameId: SHOP_GAME_ID, completed: false, saleItemId: null },
      { $set: { saleItemId: sale.itemId, salePrice: sale.salePrice, saleEndsAt: endsAt } },
      { new: true }
    );
    if (!updated) return res.json({ status: 'success', data: { started: false } });

    return res.json({
      status: 'success',
      data: { started: true, itemId: item.id, name: item.name, label: sale.label, normalPrice: item.price, salePrice: sale.salePrice, seconds: sale.seconds }
    });
  } catch (error) {
    console.error('Fun Center shop sale error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start the sale.' });
  }
});

// Starts the price rise for this trip (once). The server picks the essential and the new price.
router.post('/shop/session/:sessionId/hike/start', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const shop = getWeeklyShopDefinition();
    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });
    if (existing.hikeItemId) return res.json({ status: 'success', data: { started: false } });

    const boughtIds = new Set(existing.purchasedItems.map(entry => entry.itemId));
    const choices = getPriceHikes().filter(hike => {
      const item = shop.items.find(candidate => candidate.id === hike.itemId);
      return item && item.classification === 'need' && !(Array.isArray(item.options) && item.options.length > 0) && !boughtIds.has(hike.itemId) && hike.itemId !== existing.rivalItemId;
    });
    if (choices.length === 0) return res.json({ status: 'success', data: { started: false } });

    const hike = choices[Math.floor(Math.random() * choices.length)];
    const item = shop.items.find(candidate => candidate.id === hike.itemId);

    const updated = await FunGameSession.findOneAndUpdate(
      { sessionId, userId: user._id, gameId: SHOP_GAME_ID, completed: false, hikeItemId: null, 'purchasedItems.itemId': { $ne: hike.itemId } },
      { $set: { hikeItemId: hike.itemId, hikePrice: hike.newPrice } },
      { new: true }
    );
    if (!updated) return res.json({ status: 'success', data: { started: false } });

    return res.json({
      status: 'success',
      data: { started: true, itemId: item.id, name: item.name, oldPrice: item.price, newPrice: hike.newPrice }
    });
  } catch (error) {
    console.error('Fun Center shop price rise error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start the price rise.' });
  }
});

// Starts the rival race for this trip (once). The server picks the essential and the times.
router.post('/shop/session/:sessionId/rival/start', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const shop = getWeeklyShopDefinition();
    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });
    if (existing.rivalItemId) return res.json({ status: 'success', data: { started: false } });

    const boughtIds = new Set(existing.purchasedItems.map(entry => entry.itemId));
    const choices = shop.items.filter(item =>
      RIVAL_ITEMS.includes(item.id) &&
      item.classification === 'need' &&
      !(Array.isArray(item.options) && item.options.length > 0) &&
      !boughtIds.has(item.id) &&
      item.id !== existing.hikeItemId
    );
    if (choices.length === 0) return res.json({ status: 'success', data: { started: false } });

    const item = choices[Math.floor(Math.random() * choices.length)];
    const takesAt = new Date(Date.now() + RIVAL_SECONDS * 1000);
    const restockAt = new Date(takesAt.getTime() + RIVAL_RESTOCK_SECONDS * 1000);
    const restockPrice = item.price + RIVAL_MARKUP;

    const updated = await FunGameSession.findOneAndUpdate(
      { sessionId, userId: user._id, gameId: SHOP_GAME_ID, completed: false, rivalItemId: null, 'purchasedItems.itemId': { $ne: item.id } },
      { $set: { rivalItemId: item.id, rivalTakesAt: takesAt, rivalRestockAt: restockAt, rivalPrice: restockPrice, rivalBeaten: false } },
      { new: true }
    );
    if (!updated) return res.json({ status: 'success', data: { started: false } });

    return res.json({
      status: 'success',
      data: { started: true, itemId: item.id, name: item.name, seconds: RIVAL_SECONDS, restockSeconds: RIVAL_RESTOCK_SECONDS, normalPrice: item.price, restockPrice }
    });
  } catch (error) {
    console.error('Fun Center shop rival error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start the rival race.' });
  }
});

// The scanner: reveals whether one shelf deal is real. Costs one scan per deal; checking the same deal again is free.
router.post('/shop/session/:sessionId/scan', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const { itemId } = req.body;
    const shop = getWeeklyShopDefinition();
    const item = shop.items.find(candidate => candidate.id === itemId);
    if (!item) return res.status(400).json({ status: 'error', message: 'That item is not in the shop.' });

    const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });

    const trick = (existing.tricks || []).find(entry => entry.itemId === item.id);
    if (!trick) return res.status(400).json({ status: 'error', code: 'NOTHING_TO_SCAN', message: 'Nothing odd about this price.' });

    if (trick.scanned) {
      return res.json({ status: 'success', data: { ...describeTrick(trick, item), scansLeft: existing.scansLeft || 0 } });
    }

    // One atomic write: a scan is only spent if one is left and this deal is not yet scanned.
    const updated = await FunGameSession.findOneAndUpdate(
      {
        sessionId,
        userId: user._id,
        gameId: SHOP_GAME_ID,
        completed: false,
        scansLeft: { $gt: 0 },
        tricks: { $elemMatch: { itemId: item.id, scanned: false } }
      },
      { $inc: { scansLeft: -1 }, $set: { 'tricks.$[t].scanned': true } },
      { new: true, arrayFilters: [{ 't.itemId': item.id }] }
    );
    if (!updated) {
      return res.status(409).json({ status: 'error', code: 'NO_SCANS', message: 'You are out of scans for this trip.', scansLeft: existing.scansLeft || 0 });
    }

    return res.json({ status: 'success', data: { ...describeTrick(trick, item), scansLeft: updated.scansLeft } });
  } catch (error) {
    console.error('Fun Center shop scan error:', error);
    return res.status(500).json({ status: 'error', message: 'The scanner did not work. Try again.' });
  }
});

router.post('/shop/session', funSessionStartLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;
    const shop = getWeeklyShopDefinition();
    const situation = pickSituation();
    const tricks = pickTricks();
    const session = await FunGameSession.create({
      sessionId: createSessionId(),
      userId: user._id,
      gameId: SHOP_GAME_ID,
      budget: shop.budget,
      situationId: situation.id,
      tricks,
      scansLeft: SCANS_PER_TRIP
    });
    return res.status(201).json({
      status: 'success',
      data: {
        sessionId: session.sessionId,
        gameId: SHOP_GAME_ID,
        budget: shop.budget,
        spent: 0,
        remaining: shop.budget,
        week: getWeekSetup(situation.id),
        tricks: publicTricks(tricks),
        scansLeft: SCANS_PER_TRIP
      }
    });
  } catch (error) {
    console.error('Fun Center shop session error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start the shopping trip.' });
  }
});
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;
    const shop = getWeeklyShopDefinition();
    const situation = pickSituation();
    const session = await FunGameSession.create({
      sessionId: createSessionId(),
      userId: user._id,
      gameId: SHOP_GAME_ID,
      budget: shop.budget,
      situationId: situation.id
    });
    return res.status(201).json({
      status: 'success',
      data: { sessionId: session.sessionId, gameId: SHOP_GAME_ID, budget: shop.budget, spent: 0, remaining: shop.budget, week: getWeekSetup(situation.id) }
    });
  } catch (error) {
    console.error('Fun Center shop session error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to start the shopping trip.' });
  }
});

router.post('/shop/session/:sessionId/buy', funAnswerLimiter, async (req, res) => {
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const { itemId, optionId } = req.body;
    const shop = getWeeklyShopDefinition();
    const item = shop.items.find(candidate => candidate.id === itemId);
    if (!item) return res.status(400).json({ status: 'error', message: 'That item is not in the shop.' });

    // Items with options need a valid choice. The price always comes from the server.
    let option = null;
    if (Array.isArray(item.options) && item.options.length > 0) {
      option = item.options.find(candidate => candidate.id === optionId);
      if (!option) return res.status(400).json({ status: 'error', message: 'Pick one of the choices for that item.' });
    }
    // A flash sale only applies to its own item, and only while it is running (1.5 s grace for slow phones).
    const trip = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
    const saleActive = !!trip && !option && trip.saleItemId === item.id && typeof trip.salePrice === 'number' &&
      !!trip.saleEndsAt && trip.saleEndsAt.getTime() + 1500 > Date.now();
    const hikeActive = !!trip && !option && trip.hikeItemId === item.id && typeof trip.hikePrice === 'number';
    // Rival race: buying before he arrives beats him; after that it is sold out, then back at a higher price.
    const nowMs = Date.now();
    const rivalOn = !!trip && !option && trip.rivalItemId === item.id && !trip.rivalBeaten && !!trip.rivalTakesAt && !!trip.rivalRestockAt;
    const rivalWin = rivalOn && nowMs <= trip.rivalTakesAt.getTime() + 1500;
    const rivalSoldOut = rivalOn && !rivalWin && nowMs < trip.rivalRestockAt.getTime();
    const rivalRestocked = rivalOn && nowMs >= trip.rivalRestockAt.getTime();
    if (rivalSoldOut) {
      return res.status(409).json({ status: 'error', code: 'SOLD_OUT', message: `${item.name} is sold out. Another shopper took the last one.` });
    }
    const trickEntry = trip && !option ? (trip.tricks || []).find(entry => entry.itemId === item.id) : null;
    const trickPrice = trickEntry ? trickEntry.price : null;
    const price = option ? option.price : (saleActive ? trip.salePrice : (hikeActive ? trip.hikePrice : (rivalRestocked ? trip.rivalPrice : (trickPrice !== null ? trickPrice : item.price))));

    // Price, budget and duplicate checks all happen inside one atomic write.
    const updated = await FunGameSession.findOneAndUpdate(
      {
        sessionId,
        userId: user._id,
        gameId: SHOP_GAME_ID,
        completed: false,
        spent: { $lte: shop.budget - price },
        'purchasedItems.itemId': { $ne: item.id },
        ...(saleActive ? { saleItemId: item.id, salePrice: price } : {})
      },
      {
        $inc: { spent: price },
        ...(rivalWin ? { $set: { rivalBeaten: true } } : {}),
        $push: { purchasedItems: { itemId: item.id, optionId: option ? option.id : null, price, classification: item.classification, correct: item.classification === 'need' } }
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID });
      if (!existing) return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
      if (existing.completed) return res.status(409).json({ status: 'error', code: 'SHOP_FINISHED', message: 'This shopping trip is already finished.' });
      if (existing.purchasedItems.some(entry => entry.itemId === item.id)) {
        return res.status(409).json({ status: 'error', code: 'ALREADY_IN_BASKET', message: `${item.name} is already in your basket.` });
      }
      return res.status(409).json({
        status: 'error',
        code: 'INSUFFICIENT_FUNDS',
        message: `Not enough money left for ${item.name}.`,
        remaining: Math.max(0, shop.budget - (existing.spent || 0))
      });
    }

    return res.json({
      status: 'success',
      data: {
        itemId: item.id,
        optionId: option ? option.id : null,
        optionLabel: option ? option.label : null,
        name: item.name,
        price,
        onSale: saleActive,
        priceUp: hikeActive,
        rivalBeaten: rivalWin,
        normalPrice: item.price,
        classification: item.classification,
        explanation: item.explanation,
        budget: shop.budget,
        spent: updated.spent,
        remaining: Math.max(0, shop.budget - updated.spent),
        basketCount: updated.purchasedItems.length,
        needsLeft: shop.items.filter(candidate => candidate.classification === 'need' && !updated.purchasedItems.some(entry => entry.itemId === candidate.id)).length
      }
    });
  } catch (error) {
    console.error('Fun Center shop buy error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to add that item.' });
  }
});

router.post('/shop/session/:sessionId/checkout', funSessionStartLimiter, async (req, res) => {
  const mongoSession = await mongoose.startSession();
  try {
    const user = await requireFunCenterUser(req, res);
    if (!user) return;

    const { sessionId } = req.params;
    const shop = getWeeklyShopDefinition();
    const needsTotal = shop.items.filter(item => item.classification === 'need').length;
    let checkoutResult = null;

    await mongoSession.withTransaction(async () => {
      const existing = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID }).session(mongoSession);
      if (!existing) { const error = new Error('Shopping trip not found.'); error.code = 'SESSION_NOT_FOUND'; throw error; }
      if (!existing.purchasedItems || existing.purchasedItems.length === 0) { const error = new Error('Add at least one item to your basket first.'); error.code = 'BASKET_EMPTY'; throw error; }

      const summary = buildShopSummary(shop, existing);
      const reward = existing.situationId
        ? calculateReward(summary.stars, 3)
        : calculateReward(Math.max(0, summary.needsBought.length - summary.wantsBought.length), needsTotal);

      const claimed = await FunGameSession.findOneAndUpdate(
        { sessionId, userId: user._id, gameId: SHOP_GAME_ID, completed: false, rewardGranted: false },
        { $set: { completed: true, rewardGranted: true, score: summary.score, stars: summary.stars, correctAnswers: summary.needsBought.length, roundsCompleted: existing.purchasedItems.length, xpAwarded: reward.xp, coinsAwarded: reward.coins, completedAt: new Date() } },
        { new: true, session: mongoSession }
      );

      if (!claimed) {
        const done = await FunGameSession.findOne({ sessionId, userId: user._id, gameId: SHOP_GAME_ID }).session(mongoSession);
        if (done && done.completed && done.rewardGranted) {
          checkoutResult = { alreadyCompleted: true, ...buildShopSummary(shop, done), xp: done.xpAwarded, coins: done.coinsAwarded };
          return;
        }
        const error = new Error('Checkout could not be claimed.'); error.code = 'SESSION_CLAIM_FAILED'; throw error;
      }

      const profile = await FunGameProfile.findOneAndUpdate(
        { userId: user._id },
        { $inc: { totalXP: reward.xp, totalCoins: reward.coins, gamesPlayed: 1, gamesCompleted: 1, totalRoundsPlayed: claimed.roundsCompleted } },
        { upsert: true, new: true, session: mongoSession, setDefaultsOnInsert: true }
      );

      const currentBest = profile.bestScores && typeof profile.bestScores.get === 'function' ? profile.bestScores.get(SHOP_GAME_ID) : null;
      if (currentBest === undefined || currentBest === null || summary.score > currentBest) {
        profile.bestScores.set(SHOP_GAME_ID, summary.score);
        await profile.save({ session: mongoSession });
      }

      checkoutResult = { alreadyCompleted: false, ...summary, xp: reward.xp, coins: reward.coins, totalXP: profile.totalXP, totalCoins: profile.totalCoins };
    });

    return res.json({ status: 'success', data: checkoutResult });
  } catch (error) {
    if (error.code === 'SESSION_NOT_FOUND') return res.status(404).json({ status: 'error', message: 'Shopping trip not found.' });
    if (error.code === 'BASKET_EMPTY') return res.status(409).json({ status: 'error', code: 'BASKET_EMPTY', message: 'Add at least one item to your basket first.' });
    if (error.code === 'SESSION_CLAIM_FAILED') return res.status(409).json({ status: 'error', message: 'Checkout could not be completed.' });
    console.error('Fun Center shop checkout error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to finish the shopping trip.' });
  } finally {
    await mongoSession.endSession();
  }
});

module.exports = router;
