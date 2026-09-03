const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const UserSession = require('../models/UserSession');
const PasswordResetToken = require('../models/PasswordResetToken');
const VerificationToken = require('../models/VerificationToken');

const router = express.Router();

function limiterMessage(code, message) {
  return {
    status: 'error',
    code,
    message
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(
    limiterMessage(
      'AUTH_RATE_LIMITED',
      'Too many login attempts. Please wait a few minutes and try again.'
    )
  )
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(
    limiterMessage(
      'REGISTRATION_RATE_LIMITED',
      'Too many account creation attempts. Please try again later.'
    )
  )
});

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(
    limiterMessage(
      'VERIFICATION_RATE_LIMITED',
      'Too many verification attempts. Please wait a few minutes and try again.'
    )
  )
});

const codeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(
    limiterMessage(
      'CODE_REQUEST_RATE_LIMITED',
      'Too many requests. Please wait a few minutes and try again.'
    )
  )
});

const SESSION_DAYS = 30;
const RESET_MINUTES = 30;
const VERIFICATION_MINUTES = 5;
const VERIFICATION_MAX_ATTEMPTS = 5;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'miimiid_session';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function maskEmail(email) {
  const value = String(email || '');
  const at = value.indexOf('@');
  if (at <= 0) return value;

  const name = value.slice(0, at);
  const domain = value.slice(at);
  if (name.length <= 2) return `${name[0] || ''}*${domain}`;

  return name[0] + '*'.repeat(Math.min(name.length - 2, 5)) + name[name.length - 1] + domain;
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const parts = String(storedHash || '').split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return resolve(false);

    const expected = Buffer.from(parts[2], 'hex');
    crypto.scrypt(password, parts[1], expected.length, { N: 16384, r: 8, p: 1 }, (error, derivedKey) => {
      if (error) return reject(error);
      if (derivedKey.length !== expected.length) return resolve(false);
      resolve(crypto.timingSafeEqual(derivedKey, expected));
    });
  });
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  });
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

async function createSession(userId) {
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await UserSession.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt
  });

  return token;
}

async function getAuthenticatedUser(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return null;

  const session = await UserSession.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() }
  }).populate('userId');

  return session ? session.userId : null;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email || '',
    gender: user.gender || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : null,
    emailVerified: user.emailVerified === true,
    accountVerified: user.accountVerified === true
  };
}

function getMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const configuredPort = Number(process.env.SMTP_PORT || 465);

  if (!host || !user || !password) return null;

  return nodemailer.createTransport({
    host,
    port: configuredPort,
    secure: configuredPort === 465,
    auth: { user, pass: password },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
}

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const dateOfBirth = typeof req.body.dateOfBirth === 'string' ? req.body.dateOfBirth.trim() : '';
    const gender = typeof req.body.gender === 'string' ? req.body.gender.trim() : '';

    if (!firstName || firstName.length > 50) return res.status(400).json({ status: 'error', code: 'INVALID_FIRST_NAME', message: 'Enter your first name.' });
    if (!lastName || lastName.length > 50) return res.status(400).json({ status: 'error', code: 'INVALID_LAST_NAME', message: 'Enter your last name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
    if (!gender || gender.length > 50) return res.status(400).json({ status: 'error', code: 'INVALID_GENDER', message: 'Select your gender.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return res.status(400).json({ status: 'error', code: 'INVALID_DATE_OF_BIRTH', message: 'Enter a valid date of birth.' });

    const parsedDate = new Date(`${dateOfBirth}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dateOfBirth) {
      return res.status(400).json({ status: 'error', code: 'INVALID_DATE_OF_BIRTH', message: 'Enter a valid date of birth.' });
    }

    if (parsedDate.getTime() > Date.now()) return res.status(400).json({ status: 'error', code: 'FUTURE_DATE_OF_BIRTH', message: 'Date of birth cannot be in the future.' });

    const today = new Date();
    let age = today.getUTCFullYear() - parsedDate.getUTCFullYear();
    if (today.getUTCMonth() < parsedDate.getUTCMonth() || (today.getUTCMonth() === parsedDate.getUTCMonth() && today.getUTCDate() < parsedDate.getUTCDate())) age -= 1;
    if (age < 18) return res.status(400).json({ status: 'error', code: 'AGE_REQUIREMENT', message: 'You must be at least 18 years old to create a Miimiid account.' });

    if (password.length < 8) return res.status(400).json({ status: 'error', code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ status: 'error', code: 'ACCOUNT_EXISTS', message: 'An account with that email already exists.' });

    const mailer = getMailer();
    if (!mailer) {
      console.error('Registration requested but SMTP is not configured.');
      return res.status(503).json({ status: 'error', code: 'EMAIL_SERVICE_NOT_CONFIGURED', message: 'Account verification email service is not configured yet.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ firstName, lastName, email, gender, dateOfBirth: parsedDate, passwordHash, emailVerified: false, accountVerified: false });

    await VerificationToken.deleteMany({ userId: user._id, purpose: 'account-verification' });
    const code = createVerificationCode();
    await VerificationToken.create({ userId: user._id, tokenHash: hashVerificationCode(code), purpose: 'account-verification', expiresAt: new Date(Date.now() + VERIFICATION_MINUTES * 60 * 1000), attempts: 0 });

    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Your Miimiid verification code',
        text: `Your Miimiid verification code is ${code}.\n\nThis code expires in ${VERIFICATION_MINUTES} minutes.\n\nIf you did not create a Miimiid account, you can ignore this email.`,
        html: `<p>Welcome to Miimiid.</p><p>Your account verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;">${code}</p><p>This code expires in ${VERIFICATION_MINUTES} minutes.</p><p>If you did not create a Miimiid account, you can ignore this email.</p>`
      });
    } catch (mailError) {
      await VerificationToken.deleteMany({ userId: user._id, purpose: 'account-verification' });
      await User.deleteOne({ _id: user._id });
      throw mailError;
    }

    return res.status(201).json({
      status: 'success',
      data: { verificationRequired: true, verificationMethod: 'email', maskedEmail: maskEmail(user.email), expiresInSeconds: VERIFICATION_MINUTES * 60 }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ status: 'error', code: 'REGISTRATION_FAILED', message: 'Unable to create your account.' });
  }
});

router.post('/verify-account', verificationLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
    if (!/^\d{6}$/.test(code)) return res.status(400).json({ status: 'error', code: 'INVALID_VERIFICATION_CODE', message: 'Enter the 6-digit verification code.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ status: 'error', code: 'INVALID_VERIFICATION_REQUEST', message: 'This verification request is invalid.' });

    if (user.accountVerified === true && user.emailVerified === true) {
      const sessionToken = await createSession(user._id);
      setSessionCookie(res, sessionToken);
      return res.status(200).json({ status: 'success', data: { verified: true, user: publicUser(user) } });
    }

    const verification = await VerificationToken.findOne({ userId: user._id, purpose: 'account-verification', expiresAt: { $gt: new Date() } });
    if (!verification) return res.status(400).json({ status: 'error', code: 'VERIFICATION_EXPIRED', message: 'This verification code has expired. Request a new code.' });

    if (Number(verification.attempts || 0) >= VERIFICATION_MAX_ATTEMPTS) return res.status(429).json({ status: 'error', code: 'VERIFICATION_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Request a new verification code.' });

    const submitted = Buffer.from(hashVerificationCode(code), 'hex');
    const stored = Buffer.from(verification.tokenHash, 'hex');
    const matches = submitted.length === stored.length && crypto.timingSafeEqual(submitted, stored);

    if (!matches) {
      verification.attempts = Number(verification.attempts || 0) + 1;
      await verification.save();
      return res.status(400).json({ status: 'error', code: 'INVALID_VERIFICATION_CODE', message: 'That verification code is incorrect.' });
    }

    user.emailVerified = true;
    user.accountVerified = true;
    await user.save();
    await VerificationToken.deleteMany({ userId: user._id, purpose: 'account-verification' });

    const sessionToken = await createSession(user._id);
    setSessionCookie(res, sessionToken);

    return res.status(200).json({ status: 'success', data: { verified: true, user: publicUser(user) } });
  } catch (error) {
    console.error('Account verification error:', error);
    return res.status(500).json({ status: 'error', code: 'VERIFICATION_FAILED', message: 'Unable to verify your account.' });
  }
});

router.post('/resend-verification', codeRequestLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ status: 'success', message: 'If an unverified account exists for that email, a new verification code will be sent.' });

    if (user.accountVerified === true && user.emailVerified === true) {
      const sessionToken = await createSession(user._id);
      setSessionCookie(res, sessionToken);
      return res.status(200).json({ status: 'success', data: { verified: true, user: publicUser(user) } });
    }

    const mailer = getMailer();
    if (!mailer) return res.status(503).json({ status: 'error', code: 'EMAIL_SERVICE_NOT_CONFIGURED', message: 'Account verification email service is not configured yet.' });

    await VerificationToken.deleteMany({ userId: user._id, purpose: 'account-verification' });
    const code = createVerificationCode();
    await VerificationToken.create({ userId: user._id, tokenHash: hashVerificationCode(code), purpose: 'account-verification', expiresAt: new Date(Date.now() + VERIFICATION_MINUTES * 60 * 1000), attempts: 0 });

    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Your new Miimiid verification code',
      text: `Your new Miimiid verification code is ${code}.\n\nThis code expires in ${VERIFICATION_MINUTES} minutes.\n\nIf you did not create a Miimiid account, you can ignore this email.`,
      html: `<p>Your new Miimiid verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;">${code}</p><p>This code expires in ${VERIFICATION_MINUTES} minutes.</p>`
    });

    return res.status(200).json({ status: 'success', data: { verificationRequired: true, verificationMethod: 'email', maskedEmail: maskEmail(user.email), expiresInSeconds: VERIFICATION_MINUTES * 60 } });
  } catch (error) {
    console.error('Verification resend error:', error);
    return res.status(500).json({ status: 'error', code: 'VERIFICATION_RESEND_FAILED', message: 'Unable to send a new verification code.' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');

    if (!identifier || !password) return res.status(400).json({ status: 'error', code: 'LOGIN_FIELDS_REQUIRED', message: 'Email address and password are required.' });

    const normalizedEmail = normalizeEmail(identifier);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Invalid login details.' });

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: 'Invalid login details.' });

    if (!user.accountVerified || !user.emailVerified) return res.status(403).json({ status: 'error', code: 'ACCOUNT_NOT_VERIFIED', message: 'Please verify your email before logging in.', data: { maskedEmail: maskEmail(user.email) } });

    const token = await createSession(user._id);
    setSessionCookie(res, token);

    return res.status(200).json({ status: 'success', data: { user: publicUser(user) } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ status: 'error', code: 'LOGIN_FAILED', message: 'Unable to log in.' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ status: 'error', code: 'NOT_AUTHENTICATED', message: 'Not authenticated.' });
    return res.status(200).json({ status: 'success', data: { user: publicUser(user) } });
  } catch (error) {
    console.error('Authentication lookup error:', error);
    return res.status(500).json({ status: 'error', code: 'AUTH_LOOKUP_FAILED', message: 'Unable to determine authentication state.' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (token) await UserSession.deleteOne({ tokenHash: hashToken(token) });
    clearSessionCookie(res);
    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Logout error:', error);
    clearSessionCookie(res);
    return res.status(200).json({ status: 'success' });
  }
});

router.post('/forgot-password', codeRequestLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });

    const generic = 'If an account exists for that email, password recovery instructions will be sent.';
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ status: 'success', message: generic });

    const mailer = getMailer();
    if (!mailer) return res.status(503).json({ status: 'error', code: 'EMAIL_SERVICE_NOT_CONFIGURED', message: 'Password recovery email service is not configured yet.' });

    await PasswordResetToken.deleteMany({ userId: user._id });
    const token = createToken();
    await PasswordResetToken.create({ userId: user._id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000), usedAt: null });

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/?resetToken=${encodeURIComponent(token)}`;

    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your Miimiid password',
      text: `Reset your Miimiid password using this link:\n\n${resetUrl}\n\nThis link expires in ${RESET_MINUTES} minutes.`,
      html: `<p>You requested a Miimiid password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in ${RESET_MINUTES} minutes.</p>`
    });

    return res.status(200).json({ status: 'success', message: generic });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ status: 'error', code: 'PASSWORD_RECOVERY_FAILED', message: 'Unable to process password recovery.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = typeof req.body.token === 'string' ? req.body.token : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!token) return res.status(400).json({ status: 'error', code: 'RESET_TOKEN_REQUIRED', message: 'Password reset token is required.' });
    if (password.length < 8) return res.status(400).json({ status: 'error', code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters.' });

    const reset = await PasswordResetToken.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() }, usedAt: null });
    if (!reset) return res.status(400).json({ status: 'error', code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid or has expired.' });

    const passwordHash = await hashPassword(password);
    await User.findByIdAndUpdate(reset.userId, { passwordHash });
    reset.usedAt = new Date();
    await reset.save();
    await UserSession.deleteMany({ userId: reset.userId });

    return res.status(200).json({ status: 'success', message: 'Your password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ status: 'error', code: 'PASSWORD_RESET_FAILED', message: 'Unable to reset your password.' });
  }
});

module.exports = { router, getAuthenticatedUser };
