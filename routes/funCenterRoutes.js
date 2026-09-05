const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

const { getAuthenticatedUser } = require('./authRoutes');
const FunGameSession = require('../models/FunGameSession');
const FunGameProfile = require('../models/FunGameProfile');
const { getFunCenterGames, getFunCenterGame, validateFunCenterAnswer } = require('../scripts/learningData/funCenter');

const router = express.Router();

function createSessionId() {
  return crypto.randomUUID();
}

function calculateReward(correctAnswers, totalRounds) {
  const percentage = totalRounds > 0 ? correctAnswers / totalRounds : 0;
  return { xp: 25 + Math.round(percentage * 75), coins: 5 + Math.round(percentage * 20) };
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
        feedback: round.feedback,
        choices: round.choices ? round.choices.map(choice => ({ id: choice.id, label: choice.label })) : undefined
      }))
    }));
    return res.json({ status: 'success', data: safeGames });
  } catch (error) {
    console.error('Fun Center games error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load Fun Center games.' });
  }
});

router.post('/session', async (req, res) => {
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

router.post('/session/:sessionId/answer', async (req, res) => {
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
    const update = {
      $inc: {
        roundsCompleted: 1,
        ...(correct ? { correctAnswers: 1, score: 100 } : {})
      }
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

    return res.json({ status: 'success', data: { correct, score: updatedSession.score, correctAnswers: updatedSession.correctAnswers, roundsCompleted: updatedSession.roundsCompleted, totalRounds: game.rounds.length, complete: updatedSession.roundsCompleted >= game.rounds.length } });
  } catch (error) {
    console.error('Fun Center answer error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to process game answer.' });
  }
});

router.post('/session/:sessionId/complete', async (req, res) => {
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

module.exports = router;
