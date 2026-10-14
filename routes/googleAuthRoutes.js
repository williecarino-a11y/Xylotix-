/*
 * Miimiid - "Continue with Google".
 *
 * GET  /api/auth/google-config  -> public Google Client ID for the browser
 * POST /api/auth/google         -> verifies a Google sign-in credential
 *
 * Existing accounts are signed in. New people are asked for date of birth
 * and gender first (the app is 18+), and only then is the account created.
 *
 * Mounted from routes/authRoutes.js, which hands over its own session helpers.
 */
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');

const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const CREDENTIAL_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MINIMUM_AGE = 18;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

// A password hash in a format the normal login can never match.
// Google accounts can add a real password later through "Forgot password".
function unusablePasswordHash() {
  return `oauth:${crypto.randomBytes(32).toString('hex')}`;
}

function splitName(claims, email) {
  const full = String(claims.name || '').trim();
  const parts = full.split(/\s+/).filter(Boolean);
  const first = String(claims.given_name || parts[0] || email.split('@')[0] || '').trim();
  const last = String(claims.family_name || parts.slice(1).join(' ') || '').trim();
  return { firstName: first.slice(0, 50), lastName: last.slice(0, 50) };
}

async function verifyGoogleCredential(credential) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(TOKENINFO_URL + encodeURIComponent(credential), { signal: controller.signal });
    if (!response.ok) return null;

    const claims = await response.json();
    if (!claims || claims.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (!GOOGLE_ISSUERS.includes(claims.iss)) return null;
    if (!(Number(claims.exp) * 1000 > Date.now())) return null;
    if (!(claims.email_verified === true || claims.email_verified === 'true')) return null;
    if (!claims.email) return null;

    return claims;
  } finally {
    clearTimeout(timer);
  }
}

function validateProfile(dateOfBirth, gender) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return { code: 'INVALID_DATE_OF_BIRTH', message: 'Enter a valid date of birth.' };
  }
  const parsed = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== dateOfBirth) {
    return { code: 'INVALID_DATE_OF_BIRTH', message: 'Enter a valid date of birth.' };
  }
  if (parsed.getTime() > Date.now()) {
    return { code: 'FUTURE_DATE_OF_BIRTH', message: 'Date of birth cannot be in the future.' };
  }

  const today = new Date();
  let age = today.getUTCFullYear() - parsed.getUTCFullYear();
  if (
    today.getUTCMonth() < parsed.getUTCMonth() ||
    (today.getUTCMonth() === parsed.getUTCMonth() && today.getUTCDate() < parsed.getUTCDate())
  ) {
    age -= 1;
  }
  if (age < MINIMUM_AGE) {
    return { code: 'AGE_REQUIREMENT', message: 'You must be at least 18 years old to create a Miimiid account.' };
  }

  if (!gender || gender.length > 50) {
    return { code: 'INVALID_GENDER', message: 'Select your gender.' };
  }

  return { parsed };
}

module.exports = function createGoogleAuthRouter(helpers) {
  const { createSession, setSessionCookie, publicUser } = helpers;
  const router = express.Router();

  const googleLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({
        status: 'error',
        code: 'GOOGLE_AUTH_RATE_LIMITED',
        message: 'Too many sign-in attempts. Please wait a few minutes and try again.'
      })
  });

  async function signIn(res, user) {
    const token = await createSession(user._id);
    setSessionCookie(res, token);
    return res.status(200).json({ status: 'success', data: { user: publicUser(user) } });
  }

  router.get('/google-config', (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { clientId: process.env.GOOGLE_CLIENT_ID || null }
    });
  });

  router.post('/google', googleLimiter, async (req, res) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ status: 'error', code: 'GOOGLE_NOT_CONFIGURED', message: 'Google sign-in is not available right now.' });
      }

      const body = req.body || {};
      const credential = typeof body.credential === 'string' ? body.credential.trim() : '';
      if (!credential || credential.length > 4096 || !CREDENTIAL_PATTERN.test(credential)) {
        return res.status(400).json({ status: 'error', code: 'INVALID_GOOGLE_CREDENTIAL', message: 'Google sign-in could not be completed. Please try again.' });
      }

      let claims;
      try {
        claims = await verifyGoogleCredential(credential);
      } catch (networkError) {
        console.error('Google token verification failed:', networkError);
        return res.status(502).json({ status: 'error', code: 'GOOGLE_UNREACHABLE', message: "We couldn't reach Google. Please try again." });
      }

      if (!claims) {
        return res.status(401).json({ status: 'error', code: 'GOOGLE_VERIFICATION_FAILED', message: 'Google sign-in could not be verified. Please try again.' });
      }

      const email = normalizeEmail(claims.email);
      const existing = await User.findOne({ email });

      if (existing) {
        const unverified = existing.accountVerified !== true || existing.emailVerified !== true;
        if (unverified) {
          // Google has proven who owns this email. Whatever password was set
          // while the account was unverified is discarded, so a stranger who
          // pre-registered this address cannot get in with it.
          existing.passwordHash = unusablePasswordHash();
          existing.emailVerified = true;
          existing.accountVerified = true;
          await existing.save();
        }
        return await signIn(res, existing);
      }

      const dateOfBirth = typeof body.dateOfBirth === 'string' ? body.dateOfBirth.trim() : '';
      const gender = typeof body.gender === 'string' ? body.gender.trim() : '';
      const names = splitName(claims, email);

      if (!dateOfBirth && !gender) {
        return res.status(200).json({
          status: 'success',
          data: { profileRequired: true, firstName: names.firstName, lastName: names.lastName }
        });
      }

      const checked = validateProfile(dateOfBirth, gender);
      if (!checked.parsed) {
        return res.status(400).json({ status: 'error', code: checked.code, message: checked.message });
      }

      let user;
      try {
        user = await User.create({
          firstName: names.firstName,
          lastName: names.lastName,
          email,
          gender,
          dateOfBirth: checked.parsed,
          passwordHash: unusablePasswordHash(),
          emailVerified: true,
          accountVerified: true
        });
      } catch (error) {
        if (error && error.code === 11000) {
          return res.status(409).json({ status: 'error', code: 'ACCOUNT_EXISTS', message: 'An account with that email already exists. Try signing in again.' });
        }
        throw error;
      }

      return await signIn(res, user);
    } catch (error) {
      console.error('Google sign-in error:', error);
      return res.status(500).json({ status: 'error', code: 'GOOGLE_AUTH_FAILED', message: 'Unable to sign in with Google.' });
    }
  });

  return router;
};
  
