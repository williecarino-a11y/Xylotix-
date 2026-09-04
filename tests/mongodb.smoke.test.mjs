import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { after, before } from 'node:test';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miimiid_test?replicaSet=rs0';

const { app } = await import('../server.js');
const supertest = (await import('supertest')).default;
const User = (await import('../models/User.js')).default;
const UserSession = (await import('../models/UserSession.js')).default;
const FunGameSession = (await import('../models/FunGameSession.js')).default;
const FunGameProfile = (await import('../models/FunGameProfile.js')).default;
const { getFunCenterGame } = await import('../scripts/learningData/funCenter.js');
const request = supertest(app);

async function prepareReplicaSet() {
  const bootstrapUri = mongoUri.replace(/[?].*$/, '');
  await mongoose.connect(bootstrapUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });

  try {
    await mongoose.connection.db.admin().command({ replSetInitiate: {} });
  } catch (error) {
    if (!['AlreadyInitialized', 23, 93].includes(error.codeName) && !String(error.message).includes('already initialized')) {
      throw error;
    }
  }

  await mongoose.disconnect();
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    replicaSet: 'rs0'
  });

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const status = await mongoose.connection.db.admin().command({ replSetGetStatus: 1 });
      if (status.myState === 1) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('MongoDB replica set did not become PRIMARY in time.');
}

before(async () => {
  await prepareReplicaSet();
});

after(async () => {
  await mongoose.disconnect();
});

test('application reports ready against a real MongoDB replica set', async () => {
  assert.equal(mongoose.connection.readyState, 1);

  const response = await request.get('/api/health/ready');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'OK');
  assert.equal(response.body.services.database, 'connected');
});

test('Fun Center completion persists rewards atomically in real MongoDB', async () => {
  await FunGameSession.deleteMany({});
  await FunGameProfile.deleteMany({});
  await UserSession.deleteMany({});
  await User.deleteMany({ email: 'mongo-smoke@example.com' });

  const user = await User.create({
    firstName: 'Mongo',
    lastName: 'Smoke',
    email: 'mongo-smoke@example.com',
    gender: 'prefer-not-to-say',
    dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    passwordHash: 'smoke-test-hash',
    emailVerified: true,
    accountVerified: true
  });

  const rawSessionToken = crypto.randomBytes(32).toString('hex');
  await UserSession.create({
    userId: user._id,
    tokenHash: crypto.createHash('sha256').update(rawSessionToken).digest('hex'),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  const agent = supertest.agent(app);
  agent.set('Cookie', `miimiid_session=${rawSessionToken}`);

  const game = getFunCenterGame('needs-vs-wants');
  assert.ok(game);

  const start = await agent.post('/api/fun-center/session').send({ gameId: game.id });
  assert.equal(start.status, 201);
  const sessionId = start.body.data.sessionId;

  for (let index = 0; index < game.rounds.length; index += 1) {
    const answer = await agent.post(`/api/fun-center/session/${sessionId}/answer`).send({
      roundIndex: index,
      answer: game.rounds[index].answer
    });
    assert.equal(answer.status, 200);
    assert.equal(answer.body.data.roundsCompleted, index + 1);
  }

  const completions = await Promise.all([
    agent.post(`/api/fun-center/session/${sessionId}/complete`).send({}),
    agent.post(`/api/fun-center/session/${sessionId}/complete`).send({})
  ]);

  assert.equal(completions[0].status, 200);
  assert.equal(completions[1].status, 200);

  const completed = completions.map(response => response.body.data);
  assert.equal(completed.filter(result => result.alreadyCompleted === false).length, 1);
  assert.equal(completed.filter(result => result.alreadyCompleted === true).length, 1);

  const profile = await FunGameProfile.findOne({ userId: user._id }).lean();
  assert.ok(profile);
  assert.equal(profile.gamesCompleted, 1);
  assert.equal(profile.gamesPlayed, 1);
  assert.equal(profile.totalRoundsPlayed, game.rounds.length);

  const persistedSession = await FunGameSession.findOne({ sessionId }).lean();
  assert.ok(persistedSession);
  assert.equal(persistedSession.completed, true);
  assert.equal(persistedSession.rewardGranted, true);
});
