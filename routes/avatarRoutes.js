/**
 * Miimiid profile photo.
 *
 * Mounted at /api/profile (see server.js).
 *   GET    /api/profile/avatar/status   -> { hasAvatar, version }
 *   GET    /api/profile/avatar          -> the image (own photo only)
 *   PUT    /api/profile/avatar          -> { image: "data:image/jpeg;base64,..." }
 *   DELETE /api/profile/avatar
 *
 * The browser crops and shrinks the photo to a small square before sending it.
 * The server still checks the type, the real file signature and the size.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');

const { getAuthenticatedUser } = require('./authRoutes');
const User = require('../models/User');

const router = express.Router();

const MAX_PHOTO_BYTES = 200 * 1024;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

const avatarWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ status: 'error', code: 'AVATAR_RATE_LIMITED', message: 'Too many photo changes. Please wait a few minutes and try again.' })
});

async function requireUser(req, res) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      res.status(401).json({ status: 'error', message: 'Authentication required.' });
      return null;
    }
    return user;
  } catch (error) {
    console.error('Avatar authentication error:', error);
    res.status(500).json({ status: 'error', message: 'Unable to verify authentication.' });
    return null;
  }
}

// The first bytes of the file must match the type it claims to be.
function signatureMatches(type, buf) {
  if (type === 'image/jpeg') return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (type === 'image/png') return buf.length > 8 && buf[0] === 0x89 && buf.slice(1, 4).toString('ascii') === 'PNG';
  if (type === 'image/webp') return buf.length > 12 && buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  return false;
}

router.get('/avatar/status', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const doc = await User.findById(user._id).select('avatarUpdatedAt');
    const version = doc && doc.avatarUpdatedAt ? new Date(doc.avatarUpdatedAt).getTime() : null;
    res.set('Cache-Control', 'no-store');
    return res.json({ status: 'success', data: { hasAvatar: !!version, version } });
  } catch (error) {
    console.error('Avatar status error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load your photo.' });
  }
});

router.get('/avatar', async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    const doc = await User.findById(user._id).select('+avatarData avatarType');
    if (!doc || !doc.avatarData || !doc.avatarType) {
      return res.status(404).json({ status: 'error', message: 'No profile photo.' });
    }
    const image = Buffer.from(doc.avatarData);
    res.set({
      'Content-Type': doc.avatarType,
      'Content-Length': String(image.length),
      // The page asks with ?v=<version>, so a new photo is a new URL.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.send(image);
  } catch (error) {
    console.error('Avatar read error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to load your photo.' });
  }
});

router.put('/avatar', avatarWriteLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;

    const image = req.body && req.body.image;
    if (typeof image !== 'string' || image.length > Math.ceil(MAX_PHOTO_BYTES * 4 / 3) + 100) {
      return res.status(400).json({ status: 'error', message: 'That photo is too large. Choose a smaller one.' });
    }
    const match = DATA_URL.exec(image);
    if (!match) {
      return res.status(400).json({ status: 'error', message: 'Please choose a JPEG, PNG or WebP photo.' });
    }

    const type = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({ status: 'error', message: 'That photo is too large. Choose a smaller one.' });
    }
    if (!signatureMatches(type, buffer)) {
      return res.status(400).json({ status: 'error', message: 'That file is not a valid photo.' });
    }

    const now = new Date();
    await User.updateOne(
      { _id: user._id },
      { $set: { avatarData: buffer, avatarType: type, avatarUpdatedAt: now } }
    );
    return res.json({ status: 'success', data: { hasAvatar: true, version: now.getTime() } });
  } catch (error) {
    console.error('Avatar save error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to save your photo.' });
  }
});

router.delete('/avatar', avatarWriteLimiter, async (req, res) => {
  try {
    const user = await requireUser(req, res);
    if (!user) return;
    await User.updateOne(
      { _id: user._id },
      { $unset: { avatarData: '', avatarType: '', avatarUpdatedAt: '' } }
    );
    return res.json({ status: 'success', data: { hasAvatar: false, version: null } });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return res.status(500).json({ status: 'error', message: 'Unable to remove your photo.' });
  }
});

module.exports = router;
