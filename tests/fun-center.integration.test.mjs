import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
const FunGameSession = (await import('../models/FunGameSession.js')).default;
const FunGameProfile = (await import('../models/FunGameProfile.js')).default;
const { getFunCenterGames, getFunCenterGame, validateFunCenterAnswer } = await import('../scripts/learningData/funCenter.js');

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const game = getFunCenterGames()[0];
assert.ok(game, 'Fun Center fixture must contain at least one game');

const sessions = new Map();
const profiles = new Map();

function key(user, sessionId) {
  return `${String(user)}:${sessionId}`;
}

function makeSession(data) {
  const session = {
    sessionId: data.sessionId,
    userId: data.userId,
    gameId: data.gameId,
    score: 0,
    correctAnswers: 0,
    roundsCompleted: 0,
    maxCombo: 0,
    completed: false,
    rewardGranted: false,
    xpAwarded: 0,
    coinsAwarded: 0,
    save: async function () { sessions.set(key(this.userId, this.sessionId), this); return this; }
  };
  sessions.set(key(session.userId, session.sessionId), session);
  return session;
}

FunGameSession.create = async data => makeSession(data);
FunGameSession.findOne = async filter => sessions.get(key(filter.userId, filter.sessionId)) || null;
FunGameSession.findOneAndUpdate = async (filter, update) => {
  const session = sessions.get(key(filter.userId, filter.sessionId));
  if (!session || session.completed || session.rewardGranted || session.roundsCompleted < filter.roundsCompleted.$gte) return null;
  Object.assign(session, update.$set || {});
  sessions.set(key(session.userId, session.sessionId), session);
  return session;
};

FunGameProfile.findOneAndUpdate = async (filter, update) => {
  let profile = profiles.get(String(filter.userId));
  if (!profile) {
    profile = { userId: filter.userId, totalXP: 0, totalCoins: 0, gamesPlayed: 0, gamesCompleted: 0, totalRoundsPlayed: 0, bestScores: new Map(), save: async function () { profiles.set(String(this.userId), this); return this; } };
    profiles.set(String(filter.userId), profile);
  }
  for (const [field, value] of Object.entries(update.$inc || {})) profile[field] += value;
  return profile;
};

function answerSession(session, roundIndex, answer) {
  assert.equal(roundIndex, session.roundsCompleted);
  const correct = validateFunCenterAnswer(session.gameId, roundIndex, answer);
  if (correct) {
    session.correctAnswers++;
    session.score += 100;
    session.maxCombo = Math.max(session.maxCombo, session.correctAnswers);
  }
  session.roundsCompleted++;
  return correct;
}

test('Fun Center game definitions expose usable rounds and answers', () => {
  assert.ok(game.id);
  assert.ok(Array.isArray(game.rounds));
  assert.ok(game.rounds.length > 0);
  assert.ok(Array.isArray(game.answers));
  assert.ok(getFunCenterGame(game.id));
});

test('a game session progresses one round at a time', () => {
  const session = makeSession({ sessionId: 'progression-test', userId, gameId: game.id });
  assert.equal(session.roundsCompleted, 0);
  answerSession(session, 0, '__invalid-answer__');
  assert.equal(session.roundsCompleted, 1);
  assert.throws(() => assert.equal(0, session.roundsCompleted), /0/);
});

test('a session belonging to another user is not addressable', async () => {
  makeSession({ sessionId: 'private-session', userId: otherUserId, gameId: game.id });
  const result = await FunGameSession.findOne({ sessionId: 'private-session', userId });
  assert.equal(result, null);
});

test('reward claim is atomic and cannot be claimed twice', async () => {
  const session = makeSession({ sessionId: 'reward-test', userId, gameId: game.id });
  session.roundsCompleted = game.rounds.length;
  session.correctAnswers = game.rounds.length;
  session.score = game.rounds.length * 100;

  const reward = { xp: 100, coins: 25 };
  const first = await FunGameSession.findOneAndUpdate(
    { sessionId: session.sessionId, userId, completed: false, rewardGranted: false, roundsCompleted: { $gte: game.rounds.length } },
    { $set: { completed: true, rewardGranted: true, xpAwarded: reward.xp, coinsAwarded: reward.coins } }
  );
  assert.ok(first);
  assert.equal(first.rewardGranted, true);

  const second = await FunGameSession.findOneAndUpdate(
    { sessionId: session.sessionId, userId, completed: false, rewardGranted: false, roundsCompleted: { $gte: game.rounds.length } },
    { $set: { completed: true, rewardGranted: true, xpAwarded: reward.xp, coinsAwarded: reward.coins } }
  );
  assert.equal(second, null);
});

test('profile rewards are incremented once for a completed game', async () => {
  const profile = await FunGameProfile.findOneAndUpdate(
    { userId },
    { $inc: { totalXP: 100, totalCoins: 25, gamesPlayed: 1, gamesCompleted: 1, totalRoundsPlayed: game.rounds.length } },
    { upsert: true, new: true }
  );
  assert.equal(profile.totalXP, 100);
  assert.equal(profile.totalCoins, 25);
  assert.equal(profile.gamesPlayed, 1);
  assert.equal(profile.gamesCompleted, 1);
  assert.equal(profile.totalRoundsPlayed, game.rounds.length);
});
