const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const PasswordResetCode = require('../models/PasswordResetCode');
const PasswordResetToken = require('../models/PasswordResetToken');
const { getMailer } = require('../utils/mailer');

const router = express.Router();

const CODE_MINUTES = 10;
const CODE_MAX_ATTEMPTS = 5;
const RESET_TOKEN_MINUTES = 15;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function limiterMessage(code, message) {
  return { status: 'error', code, message };
}

const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(
      limiterMessage('RESET_CODE_REQUEST_RATE_LIMITED', 'Too many requests. Please wait a few minutes and try again.')
    )
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json(
      limiterMessage('RESET_CODE_VERIFY_RATE_LIMITED', 'Too many attempts. Please wait a few minutes and try again.')
    )
});

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
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

/*
 * Step 1: the user asks for a 6-digit reset code.
 * The response is identical whether or not the account exists,
 * so this route cannot be used to discover registered emails.
 */
router.post('/forgot-password-code', requestLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
    }

    const response = {
      status: 'success',
      data: {
        codeSent: true,
        maskedEmail: maskEmail(email),
        expiresInSeconds: CODE_MINUTES * 60
      }
    };

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json(response);

    const mailer = getMailer();
    if (!mailer) {
      return res.status(503).json({ status: 'error', code: 'EMAIL_SERVICE_NOT_CONFIGURED', message: 'Password recovery email service is not configured yet.' });
    }

    await PasswordResetCode.deleteMany({ userId: user._id });
    const code = String(crypto.randomInt(100000, 1000000));
    await PasswordResetCode.create({
      userId: user._id,
      codeHash: sha256(code),
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000)
    });

    try {
      await mailer.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Your Miimiid password reset code',
        text: `Your Miimiid password reset code is ${code}.\n\nThis code expires in ${CODE_MINUTES} minutes.\n\nIf you did not request a password reset, you can ignore this email.`,
        html: `<p>You requested a Miimiid password reset.</p><p>Your reset code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px;">${code}</p><p>This code expires in ${CODE_MINUTES} minutes.</p><p>If you did not request a password reset, you can ignore this email.</p>`
      });
    } catch (mailError) {
      console.error('Password reset code email failed:', mailError);
      await PasswordResetCode.deleteMany({ userId: user._id });
      return res.status(502).json({ status: 'error', code: 'EMAIL_SEND_FAILED', message: "We couldn't send the reset code. Please try again." });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Forgot password code error:', error);
    return res.status(500).json({ status: 'error', code: 'PASSWORD_RECOVERY_FAILED', message: 'Unable to process password recovery.' });
  }
});

/*
 * Step 2: the user submits the code.
 * Every attempt is counted atomically before the code is compared,
 * so parallel guesses cannot exceed the attempt limit.
 * On success a short-lived reset token is returned, which the existing
 * POST /reset-password route accepts together with the new password.
 */
router.post('/verify-reset-code', verifyLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    const code = String((req.body && req.body.code) || '').trim();

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
    }
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ status: 'error', code: 'INVALID_RESET_CODE', message: 'Enter the 6-digit code.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ status: 'error', code: 'INVALID_RESET_CODE', message: 'That code is incorrect or has expired.' });
    }

    const now = new Date();
    const record = await PasswordResetCode.findOneAndUpdate(
      { userId: user._id, expiresAt: { $gt: now }, attempts: { $lt: CODE_MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true }
    );

    if (!record) {
      const stillActive = await PasswordResetCode.exists({ userId: user._id, expiresAt: { $gt: now } });
      if (stillActive) {
        return res.status(429).json({ status: 'error', code: 'RESET_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Request a new code.' });
      }
      return res.status(400).json({ status: 'error', code: 'RESET_CODE_EXPIRED', message: 'This code has expired. Request a new one.' });
    }

    const submitted = Buffer.from(sha256(code), 'hex');
    const stored = Buffer.from(record.codeHash, 'hex');
    const matches = submitted.length === stored.length && crypto.timingSafeEqual(submitted, stored);

    if (!matches) {
      return res.status(400).json({ status: 'error', code: 'INVALID_RESET_CODE', message: 'That code is incorrect.' });
    }

    await PasswordResetCode.deleteMany({ userId: user._id });
    await PasswordResetToken.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: sha256(resetToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
      usedAt: null
    });

    return res.status(200).json({ status: 'success', data: { resetToken } });
  } catch (error) {
    console.error('Verify reset code error:', error);
    return res.status(500).json({ status: 'error', code: 'RESET_CODE_VERIFY_FAILED', message: 'Unable to verify the code.' });
  }
});

module.exports = router;
    
