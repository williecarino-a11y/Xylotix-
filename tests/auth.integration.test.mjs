import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
const User = (await import('../models/User.js')).default;
const UserSession = (await import('../models/UserSession.js')).default;
const VerificationToken = (await import('../models/VerificationToken.js')).default;
const PasswordResetToken = (await import('../models/PasswordResetToken.js')).default;
const { app } = await import('../server.js');
const supertest = (await import('supertest')).default;

const request = supertest(app);
const userId = new mongoose.Types.ObjectId();
const email = 'auth.integration@example.com';
const originalPassword = 'correct-password-123';
const resetPassword = 'new-password-456';
const verificationCode = '246810';

const sessions = new Map();
let user;
let verification;
let resetToken;
let passwordHash;
let deletedSessionCount = 0;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password, salt = 'integration-test-salt') {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function matchesFilter(value, filter) {
  if (!filter) return true;
  if (filter.$gt) return value > filter.$gt;
  return value === filter;
}

function sessionQuery(filter) {
  const match = [...sessions.values()].find(session =>
    session.tokenHash === filter.tokenHash && matchesFilter(session.expiresAt, filter.expiresAt)
  );
  return { populate: async () => match ? { ...match, userId: user } : null };
}

function resetQuery(filter) {
  const match = resetToken && resetToken.tokenHash === filter.tokenHash &&
    resetToken.usedAt === null && matchesFilter(resetToken.expiresAt, filter.expiresAt);
  return Promise.resolve(match ? resetToken : null);
}

User.findOne = async filter => {
  if (filter.email !== email) return null;
  return user;
};
User.findByIdAndUpdate = async (id, update) => {
  if (String(id) !== String(userId)) return null;
  Object.assign(user, update);
  return user;
};
UserSession.create = async data => {
  const session = { ...data };
  const token = crypto.randomBytes(32).toString('hex');
  session.token = token;
  sessions.set(session.tokenHash, session);
  return session;
};
UserSession.findOne = sessionQuery;
UserSession.deleteOne = async filter => {
  for (const [key, session] of sessions) {
    if (session.tokenHash === filter.tokenHash) {
      sessions.delete(key);
      return { deletedCount: 1 };
    }
  }
  return { deletedCount: 0 };
};
UserSession.deleteMany = async () => {
  const count = sessions.size;
  sessions.clear();
  deletedSessionCount += count;
  return { deletedCount: count };
};
VerificationToken.findOne = async filter => {
  if (!verification) return null;
  if (verification.userId.toString() !== filter.userId.toString()) return null;
  if (verification.purpose !== filter.purpose) return null;
  if (!matchesFilter(verification.expiresAt, filter.expiresAt)) return null;
  return verification;
};
VerificationToken.deleteMany = async () => {
  verification = null;
  return { deletedCount: 1 };
};
PasswordResetToken.findOne = resetQuery;
PasswordResetToken.findOneAndUpdate = async filter => {
  if (!resetToken || String(resetToken._id) !== String(filter._id) || resetToken.usedAt !== null || !matchesFilter(resetToken.expiresAt, filter.expiresAt)) return null;
  resetToken.usedAt = new Date();
  return resetToken;
};

user = {
  _id: userId,
  firstName: 'Integration',
  lastName: 'User',
  email,
  gender: 'unspecified',
  dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
  emailVerified: false,
  accountVerified: false,
  passwordHash: await hashPassword(originalPassword),
  async save() { return this; }
};
passwordHash = user.passwordHash;
verification = {
  _id: new mongoose.Types.ObjectId(),
  userId,
  purpose: 'account-verification',
  tokenHash: crypto.createHash('sha256').update(verificationCode).digest('hex'),
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  attempts: 0,
  async save() { return this; }
};
resetToken = {
  _id: new mongoose.Types.ObjectId(),
  userId,
  tokenHash: hashToken('integration-reset-token'),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  usedAt: null
};


test('verification rejects an incorrect code and increments attempts', async () => {
  const response = await request.post('/api/auth/verify-account').send({ email, code: '111111' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'INVALID_VERIFICATION_CODE');
  assert.equal(verification.attempts, 1);
});

test('verification accepts a valid code and creates a session', async () => {
  const response = await request.post('/api/auth/verify-account').send({ email, code: verificationCode });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.verified, true);
  assert.equal(user.emailVerified, true);
  assert.equal(user.accountVerified, true);
  assert.match(response.headers['set-cookie'][0], /miimiid_session=/);
  assert.equal(sessions.size, 1);
});

test('login rejects incorrect credentials', async () => {
  const response = await request.post('/api/auth/login').send({ identifier: email, password: 'wrong-password' });
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'INVALID_CREDENTIALS');
});

test('login creates a session and /me restores the authenticated user', async () => {
  const agent = supertest.agent(app);
  const login = await agent.post('/api/auth/login').send({ identifier: email, password: originalPassword });
  assert.equal(login.status, 200);
  assert.equal(login.body.data.user.email, email);

  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.id, userId.toString());
  assert.equal(me.body.data.user.emailVerified, true);
});

test('logout revokes the session and clears authentication', async () => {
  const agent = supertest.agent(app);
  const login = await agent.post('/api/auth/login').send({ identifier: email, password: originalPassword });
  assert.equal(login.status, 200);
  const before = sessions.size;

  const logout = await agent.post('/api/auth/logout');
  assert.equal(logout.status, 200);
  assert.ok(sessions.size < before);

  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 401);
  assert.equal(me.body.code, 'NOT_AUTHENTICATED');
});

test('expired sessions are rejected and stale cookies are cleared', async () => {
  const expiredTokenHash = hashToken('expired-session-token');
  sessions.set(expiredTokenHash, {
    tokenHash: expiredTokenHash,
    userId,
    expiresAt: new Date(Date.now() - 1000)
  });

  const response = await request.get('/api/auth/me').set('Cookie', 'miimiid_session=expired-session-token');
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'NOT_AUTHENTICATED');
  assert.match(response.headers['set-cookie'][0], /miimiid_session=/);
});

test('password reset updates the password, consumes the token, and revokes sessions', async () => {
  sessions.set(hashToken('session-to-revoke'), {
    tokenHash: hashToken('session-to-revoke'),
    userId,
    expiresAt: new Date(Date.now() + 60_000)
  });
  const response = await request.post('/api/auth/reset-password').send({ token: 'integration-reset-token', password: resetPassword });
  assert.equal(response.status, 200);
  assert.equal(resetToken.usedAt instanceof Date, true);
  assert.equal(user.passwordHash !== passwordHash, true);
  assert.equal(sessions.size, 0);
  assert.ok(deletedSessionCount >= 1);
});

test('a reused password reset token is rejected', async () => {
  const response = await request.post('/api/auth/reset-password').send({ token: 'integration-reset-token', password: 'another-password-789' });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'INVALID_RESET_TOKEN');
});

test('forgot-password does not reveal whether an account exists', async () => {
  const response = await request.post('/api/auth/forgot-password').send({ email: 'does-not-exist@example.com' });
  assert.equal(response.status, 200);
  assert.equal(response.body.message, 'If an account exists for that email, password recovery instructions will be sent.');
});

test('registration rejects underage accounts before account creation', async () => {
  const response = await request.post('/api/auth/register').send({
    firstName: 'Young',
    lastName: 'User',
    email: 'underage@example.com',
    gender: 'unspecified',
    dateOfBirth: '2015-01-01',
    password: 'valid-password-123'
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'AGE_REQUIREMENT');
});
