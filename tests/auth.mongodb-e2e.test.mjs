import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import mongoose from 'mongoose';
import { SMTPServer } from 'smtp-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miimiid_test?replicaSet=rs0';
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_PORT = '2525';
process.env.SMTP_USER = 'miimiid-test';
process.env.SMTP_PASSWORD = 'miimiid-test-password';
process.env.SMTP_FROM = 'no-reply@miimiid.test';
process.env.APP_BASE_URL = 'http://localhost:3000';

const { app } = await import('../server.js');
const User = (await import('../models/User.js')).default;
const UserSession = (await import('../models/UserSession.js')).default;
const PasswordResetToken = (await import('../models/PasswordResetToken.js')).default;
const VerificationToken = (await import('../models/VerificationToken.js')).default;

const receivedMessages = [];
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onData(stream, session, callback) {
    let data = '';
    stream.on('data', chunk => { data += chunk.toString(); });
    stream.on('end', () => {
      receivedMessages.push(data);
      callback();
    });
  }
});

function latestMessageContaining(text) {
  return [...receivedMessages].reverse().find(message => message.includes(text));
}

async function waitFor(predicate, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = predicate();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error('Timed out waiting for SMTP message.');
}

function cookieHeader(response) {
  const cookies = response.headers['set-cookie'];
  assert.ok(Array.isArray(cookies) && cookies.length > 0, 'expected auth cookie');
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

const email = `e2e-${Date.now()}@example.test`;
const password = 'Miimiid!Secure123';
const replacementPassword = 'Miimiid!Reset456';

before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await Promise.all([
    User.deleteMany({ email }),
    VerificationToken.deleteMany({}),
    PasswordResetToken.deleteMany({}),
    UserSession.deleteMany({})
  ]);
  await smtp.listen(Number(process.env.SMTP_PORT), '127.0.0.1');
});

after(async () => {
  await User.deleteMany({ email });
  const user = await User.findOne({ email });
  if (user) {
    await Promise.all([
      VerificationToken.deleteMany({ userId: user._id }),
      PasswordResetToken.deleteMany({ userId: user._id }),
      UserSession.deleteMany({ userId: user._id })
    ]);
  }
  await smtp.close();
  await mongoose.disconnect();
});

test('real MongoDB auth lifecycle: register → verify → session → logout', async () => {
  const register = await request(app).post('/api/auth/register').send({
    firstName: 'E2E',
    lastName: 'Tester',
    email,
    gender: 'Prefer not to say',
    dateOfBirth: '1995-01-01',
    password
  });

  assert.equal(register.status, 201);
  assert.equal(register.body.data.verificationRequired, true);

  const userAfterRegister = await User.findOne({ email }).lean();
  assert.ok(userAfterRegister);
  assert.equal(userAfterRegister.emailVerified, false);
  assert.equal(userAfterRegister.accountVerified, false);
  assert.equal(await VerificationToken.countDocuments({ userId: userAfterRegister._id }), 1);

  const verificationMail = await waitFor(() => latestMessageContaining('Miimiid verification code'));
  const code = verificationMail.match(/\b(\d{6})\b/)?.[1];
  assert.ok(code, 'verification email must contain a six-digit code');

  const verify = await request(app).post('/api/auth/verify-account').send({ email, code });
  assert.equal(verify.status, 200);
  assert.equal(verify.body.data.verified, true);
  const sessionCookie = cookieHeader(verify);

  const persistedUser = await User.findOne({ email }).lean();
  assert.equal(persistedUser.emailVerified, true);
  assert.equal(persistedUser.accountVerified, true);
  assert.equal(await VerificationToken.countDocuments({ userId: persistedUser._id }), 0);
  assert.equal(await UserSession.countDocuments({ userId: persistedUser._id }), 1);

  const me = await request(app).get('/api/auth/me').set('Cookie', sessionCookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, email);

  const logout = await request(app).post('/api/auth/logout').set('Cookie', sessionCookie);
  assert.equal(logout.status, 200);
  assert.equal(await UserSession.countDocuments({ userId: persistedUser._id }), 0);

  const afterLogout = await request(app).get('/api/auth/me').set('Cookie', sessionCookie);
  assert.equal(afterLogout.status, 401);
});

test('real MongoDB password reset: email → reset → old password rejected → new password accepted', async () => {
  const loginBeforeReset = await request(app).post('/api/auth/login').send({ identifier: email, password });
  assert.equal(loginBeforeReset.status, 200);
  const oldSession = cookieHeader(loginBeforeReset);

  const forgot = await request(app).post('/api/auth/forgot-password').send({ email });
  assert.equal(forgot.status, 200);
  assert.match(forgot.body.message, /If an account exists/);

  const resetMail = await waitFor(() => latestMessageContaining('Reset your Miimiid password'));
  const resetUrl = resetMail.match(/https?:\/\/[^\s<]+\?resetToken=[^\s<&]+/)?.[0];
  assert.ok(resetUrl, 'reset email must contain a reset URL');
  const resetToken = decodeURIComponent(new URL(resetUrl).searchParams.get('resetToken'));
  assert.ok(resetToken);

  const resetRecord = await PasswordResetToken.findOne({ userId: (await User.findOne({ email }))._id }).lean();
  assert.ok(resetRecord);
  assert.equal(resetRecord.usedAt, null);
  assert.notEqual(resetRecord.tokenHash, resetToken);

  const reset = await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: replacementPassword });
  assert.equal(reset.status, 200);

  const reused = await request(app).post('/api/auth/reset-password').send({ token: resetToken, password: 'Another!Password789' });
  assert.equal(reused.status, 400);
  assert.equal(reused.body.code, 'INVALID_RESET_TOKEN');

  const oldLogin = await request(app).post('/api/auth/login').send({ identifier: email, password });
  assert.equal(oldLogin.status, 401);

  const newLogin = await request(app).post('/api/auth/login').send({ identifier: email, password: replacementPassword });
  assert.equal(newLogin.status, 200);

  const revokedOldSession = await request(app).get('/api/auth/me').set('Cookie', oldSession);
  assert.equal(revokedOldSession.status, 401);
});
