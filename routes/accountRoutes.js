const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { validatePassword } = require('../utils/passwordValidator');

// Make sure these models are loaded so account deletion can clear them.
['FunGameProfile'].forEach(function (name) {
  try { require('../models/' + name); } catch (error) {}
});

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

// Deletes this user's data from every model that has a userId field.
async function purgeUserData(userId) {
  for (const name of mongoose.modelNames()) {
    if (name === 'User') continue;
    const model = mongoose.model(name);
    if (model.schema.path('userId')) {
      await model.deleteMany({ userId });
    }
  }
}

module.exports = function createAccountRoutes(helpers) {
  const {
    getAuthenticatedUser,
    hashPassword,
    verifyPassword,
    publicUser,
    createSession,
    setSessionCookie,
    clearSessionCookie
  } = helpers;

  const router = express.Router();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      fail(res, 429, 'ACCOUNT_RATE_LIMITED', 'Too many attempts. Please wait a few minutes and try again.')
  });

  async function requireUser(req, res, next) {
    try {
      const user = await getAuthenticatedUser(req, res);
      if (!user) return fail(res, 401, 'NOT_AUTHENTICATED', 'Please log in again.');
      req.accountUser = user;
      return next();
    } catch (error) {
      console.error('Account auth check error:', error);
      return fail(res, 500, 'AUTH_LOOKUP_FAILED', 'Unable to verify your session.');
    }
  }

  /* ---------- edit name ---------- */
  router.post('/account/profile', limiter, requireUser, async (req, res) => {
    try {
      const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
      const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';

      if (!firstName || firstName.length > 50) return fail(res, 400, 'INVALID_FIRST_NAME', 'Enter your first name.');
      if (!lastName || lastName.length > 50) return fail(res, 400, 'INVALID_LAST_NAME', 'Enter your last name.');

      const user = req.accountUser;
      user.firstName = firstName;
      user.lastName = lastName;
      await user.save();

      return res.status(200).json({ status: 'success', data: { user: publicUser(user) } });
    } catch (error) {
      console.error('Profile update error:', error);
      return fail(res, 500, 'PROFILE_UPDATE_FAILED', 'Unable to update your name.');
    }
  });

  /* ---------- change password ---------- */
  router.post('/account/change-password', limiter, requireUser, async (req, res) => {
    try {
      const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
      const user = req.accountUser;

      if (!currentPassword) return fail(res, 400, 'CURRENT_PASSWORD_REQUIRED', 'Enter your current password.');

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) return fail(res, 400, 'INVALID_CURRENT_PASSWORD', 'Your current password is incorrect.');

      if (currentPassword === newPassword) {
        return fail(res, 400, 'PASSWORD_UNCHANGED', 'Choose a new password that is different from your current one.');
      }

      const result = validatePassword(newPassword);
      if (!result.valid) return fail(res, 400, result.errors[0].code, result.errors[0].message);

      user.passwordHash = await hashPassword(newPassword);
      await user.save();

      // Sign out every device, then keep this one signed in.
      await UserSession.deleteMany({ userId: user._id });
      const token = await createSession(user._id);
      setSessionCookie(res, token);

      return res.status(200).json({ status: 'success', message: 'Your password has been changed.' });
    } catch (error) {
      console.error('Change password error:', error);
      return fail(res, 500, 'PASSWORD_CHANGE_FAILED', 'Unable to change your password.');
    }
  });

  /* ---------- delete account ---------- */
  router.post('/account/delete', limiter, requireUser, async (req, res) => {
    try {
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      const confirm = typeof req.body.confirm === 'string' ? req.body.confirm.trim() : '';
      const user = req.accountUser;

      if (confirm !== 'DELETE') return fail(res, 400, 'CONFIRMATION_REQUIRED', 'Type DELETE to confirm.');
      if (!password) return fail(res, 400, 'CURRENT_PASSWORD_REQUIRED', 'Enter your password.');

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return fail(res, 400, 'INVALID_CURRENT_PASSWORD', 'Your password is incorrect.');

      await purgeUserData(user._id);
      await User.deleteOne({ _id: user._id });
      clearSessionCookie(res);

      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Delete account error:', error);
      return fail(res, 500, 'ACCOUNT_DELETE_FAILED', 'Unable to delete your account.');
    }
  });

  return router;
};
