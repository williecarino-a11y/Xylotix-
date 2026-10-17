const express = require('express');
const rateLimit = require('express-rate-limit');

const PushSubscription = require('../models/PushSubscription');
const ReminderSetting = require('../models/ReminderSetting');
const reminderService = require('../services/reminderService');

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

function validTimezone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = function createReminderRoutes({ requireAuth }) {
  const router = express.Router();

  // Starts the once-a-minute reminder check when the server boots
  reminderService.start();

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, 'REMINDER_RATE_LIMITED', 'Too many attempts. Please wait a few minutes.')
  });

  const testLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, 'REMINDER_TEST_LIMITED', 'Please wait a few minutes before sending another test.')
  });

  /* A public check an outside timer can call to keep the server awake */
  router.get('/ping', function (req, res) {
    return res.status(200).json({ status: 'ok' });
  });

  router.get('/config', requireAuth, async function (req, res) {
    try {
      const vapid = await reminderService.getVapid();
      const setting = await ReminderSetting.findOne({ userId: req.authUser._id });
      return res.status(200).json({
        status: 'success',
        data: {
          publicKey: vapid.publicKey,
          enabled: Boolean(setting && setting.enabled),
          hour: setting ? setting.hour : 18,
          minute: setting ? setting.minute : 0,
          streakAlerts: setting ? setting.streakAlerts !== false : true,
          reviewNudges: setting ? setting.reviewNudges !== false : true
        }
      });
    } catch (error) {
      console.error('Reminder config error:', error);
      return fail(res, 500, 'REMINDER_CONFIG_FAILED', 'Unable to load reminder settings.');
    }
  });

  /* Turn reminders on (or change the time) */
  router.post('/subscribe', requireAuth, writeLimiter, async function (req, res) {
    try {
      const userId = req.authUser._id;
      const body = req.body || {};
      const sub = body.subscription || {};
      const keys = sub.keys || {};
      const endpoint = typeof sub.endpoint === 'string' ? sub.endpoint : '';

      if (
        endpoint.indexOf('https://') !== 0 ||
        endpoint.length > 2048 ||
        typeof keys.p256dh !== 'string' ||
        typeof keys.auth !== 'string'
      ) {
        return fail(res, 400, 'INVALID_SUBSCRIPTION', 'Invalid notification subscription.');
      }

      const hour = Number(body.hour);
      const minute = Number(body.minute);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) {
        return fail(res, 400, 'INVALID_TIME', 'Choose a valid reminder time.');
      }

      const timezone = validTimezone(body.timezone) ? body.timezone : 'UTC';

      await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          $set: {
            userId,
            keys: { p256dh: keys.p256dh, auth: keys.auth },
            userAgent: String(req.get('user-agent') || '').slice(0, 200)
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // If today's time has already passed, the first reminder is tomorrow
      const local = reminderService.localParts(new Date(), timezone);
      const alreadyPassed = local.minutes >= hour * 60 + minute;

      await ReminderSetting.findOneAndUpdate(
        { userId },
        {
          $set: {
            enabled: true,
            hour,
            minute,
            timezone,
            streakAlerts: body.streakAlerts !== false,
            reviewNudges: body.reviewNudges !== false,
            lastSentDate: alreadyPassed ? local.dateKey : null
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json({ status: 'success', data: { enabled: true, hour, minute } });
    } catch (error) {
      console.error('Reminder subscribe error:', error);
      return fail(res, 500, 'REMINDER_SAVE_FAILED', 'Unable to save your reminder.');
    }
  });

  /* Turn reminders off */
  router.post('/disable', requireAuth, writeLimiter, async function (req, res) {
    try {
      await ReminderSetting.updateOne({ userId: req.authUser._id }, { $set: { enabled: false } });
      return res.status(200).json({ status: 'success', data: { enabled: false } });
    } catch (error) {
      console.error('Reminder disable error:', error);
      return fail(res, 500, 'REMINDER_DISABLE_FAILED', 'Unable to turn off your reminder.');
    }
  });

  /* Send a test notification now */
  router.post('/test', requireAuth, testLimiter, async function (req, res) {
    try {
      const sent = await reminderService.sendToUser(req.authUser._id, {
        title: 'Miimiid reminders are on',
        body: 'This is a test. Your daily reminder will look like this.',
        tag: 'miimiid-test',
        url: '/'
      });
      if (!sent) {
        return fail(res, 404, 'NO_SUBSCRIPTION', 'No notification subscription found. Turn the reminder on first.');
      }
      return res.status(200).json({ status: 'success', data: { sent } });
    } catch (error) {
      console.error('Reminder test error:', error);
      return fail(res, 500, 'REMINDER_TEST_FAILED', 'Unable to send the test notification.');
    }
  });

  return router;
};
