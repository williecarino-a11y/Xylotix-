const webpush = require('web-push');

const PushConfig = require('../models/PushConfig');
const PushSubscription = require('../models/PushSubscription');
const ReminderSetting = require('../models/ReminderSetting');
const InboxNotification = require('../models/InboxNotification');
const MissedQuestion = require('../models/MissedQuestion');
const UserProgress = require('../models/UserProgress');
const learningService = require('./learningService');
const streakService = require('./streakService');

// If the server was asleep at the exact minute, still send within this many minutes
const LATE_WINDOW_MINUTES = 120;

// Streak-at-risk: 8pm local time, only for streaks of 3+ days
const STREAK_ALERT_MINUTES = 20 * 60;
const STREAK_ALERT_MIN_STREAK = 3;

// Review nudge: noon local time, at most once a week, only with 5+ questions waiting
const REVIEW_NUDGE_MINUTES = 12 * 60;
const REVIEW_NUDGE_MIN_QUESTIONS = 5;
const REVIEW_NUDGE_GAP_MS = 7 * 24 * 60 * 60 * 1000;

let vapid = null;
let timer = null;

async function getVapid() {
  if (vapid) return vapid;

  let doc = await PushConfig.findOne({ key: 'vapid' });
  if (!doc) {
    const keys = webpush.generateVAPIDKeys();
    doc = await PushConfig.findOneAndUpdate(
      { key: 'vapid' },
      { $setOnInsert: { key: 'vapid', publicKey: keys.publicKey, privateKey: keys.privateKey } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const base = process.env.APP_BASE_URL || '';
  const subject =
    process.env.VAPID_SUBJECT ||
    (base.indexOf('https://') === 0 ? base : 'mailto:williecarino23@gmail.com');

  webpush.setVapidDetails(subject, doc.publicKey, doc.privateKey);
  vapid = { publicKey: doc.publicKey, privateKey: doc.privateKey };
  return vapid;
}

// The user's local date and minutes-since-midnight in their time zone
function localParts(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date);
    const get = function (type) { return parts.find(function (p) { return p.type === type; }).value; };
    return {
      dateKey: get('year') + '-' + get('month') + '-' + get('day'),
      minutes: Number(get('hour')) * 60 + Number(get('minute'))
    };
  } catch (error) {
    return localParts(date, 'UTC');
  }
}

function due(nowMinutes, targetMinutes) {
  const late = nowMinutes - targetMinutes;
  return late >= 0 && late <= LATE_WINDOW_MINUTES;
}

async function sendToUser(userId, payload) {
  await getVapid();
  const subscriptions = await PushSubscription.find({ userId });

  // Keep a copy in the in-app inbox (never for tests, never allowed to break sending)
  if (subscriptions.length && payload.tag !== 'miimiid-test') {
    try {
      await InboxNotification.create({
        userId,
        title: String(payload.title || 'Miimiid').slice(0, 120),
        body: String(payload.body || '').slice(0, 400)
      });
    } catch (inboxError) {
      console.error('Inbox save error:', inboxError);
    }
  }

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(subscriptions.map(async function (sub) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
        body,
        { TTL: 6 * 60 * 60 }
      );
      sent += 1;
    } catch (error) {
      if (error && (error.statusCode === 404 || error.statusCode === 410)) {
        await PushSubscription.deleteOne({ _id: sub._id });
      } else {
        console.error('Push send error:', error && error.statusCode, error && error.body);
      }
    }
  }));

  return sent;
}

// Did the user learn today, and what is their streak?
async function learningToday(userId, timeZone, now) {
  const progress = await UserProgress.find({ userId, completed: true }).sort({ completedAt: 1 });
  const today = localParts(now, timeZone).dateKey;

  const learned = progress.some(function (p) {
    return p.completedAt && localParts(p.completedAt, timeZone).dateKey === today;
  });

  return { learned, streak: learningService.calculateStreak(progress) };
}

// The daily reminder message, or null if the user already learned today
async function reminderFor(userId, timeZone, now) {
  const state = await learningToday(userId, timeZone, now);
  if (state.learned) return null;

  if (state.streak >= 1) {
    return {
      title: 'Keep your streak going',
      body: "You're on a " + state.streak + '-day streak. One lesson today keeps it alive.',
      tag: 'miimiid-streak',
      url: '/'
    };
  }

  return {
    title: 'Time for a quick lesson',
    body: 'A few minutes of learning today builds a strong money habit.',
    tag: 'miimiid-streak',
    url: '/'
  };
}

async function tick() {
  const now = new Date();
  const settings = await ReminderSetting.find({ enabled: true });

  for (const setting of settings) {
    try {
      const zone = setting.timezone || 'UTC';
      const local = localParts(now, zone);
      const dailyMinutes = setting.hour * 60 + setting.minute;

      const dailyDue =
        due(local.minutes, dailyMinutes) && setting.lastSentDate !== local.dateKey;

      // The streak alert only fires when it is at least 2 hours after the daily reminder
      const streakDue =
        setting.streakAlerts !== false &&
        due(local.minutes, STREAK_ALERT_MINUTES) &&
        setting.lastStreakAlertDate !== local.dateKey &&
        STREAK_ALERT_MINUTES - dailyMinutes >= 120;

      const reviewDue =
        setting.reviewNudges !== false &&
        due(local.minutes, REVIEW_NUDGE_MINUTES) &&
        (!setting.lastReviewNudgeAt || now - setting.lastReviewNudgeAt >= REVIEW_NUDGE_GAP_MS);

      if (!dailyDue && !streakDue && !reviewDue) continue;

      const subscriptionCount = await PushSubscription.countDocuments({ userId: setting.userId });
      if (!subscriptionCount) continue;

      /* 1. Daily reminder */
      if (dailyDue) {
        // Claim today's reminder first so it can never be sent twice
        const claimed = await ReminderSetting.findOneAndUpdate(
          { _id: setting._id, lastSentDate: { $ne: local.dateKey } },
          { $set: { lastSentDate: local.dateKey } }
        );
        if (claimed) {
          const message = await reminderFor(setting.userId, zone, now);
          if (message) await sendToUser(setting.userId, message);
        }
      }

      /* 2. Streak at risk */
      if (streakDue) {
        const claimed = await ReminderSetting.findOneAndUpdate(
          { _id: setting._id, lastStreakAlertDate: { $ne: local.dateKey } },
          { $set: { lastStreakAlertDate: local.dateKey } }
        );
        if (claimed) {
          const state = await learningToday(setting.userId, zone, now);
          if (!state.learned && state.streak >= STREAK_ALERT_MIN_STREAK) {
            await sendToUser(setting.userId, {
              title: 'Your streak is at risk',
              body: 'Your ' + state.streak + '-day streak ends tonight unless you learn something today. One lesson is enough.',
              tag: 'miimiid-streak-risk',
              url: '/'
            });
          }
        }
      }

      /* 3. Weekly review nudge */
      if (reviewDue) {
        const waiting = await MissedQuestion.countDocuments({ userId: setting.userId });
        if (waiting >= REVIEW_NUDGE_MIN_QUESTIONS) {
          const cutoff = new Date(now.getTime() - REVIEW_NUDGE_GAP_MS);
          const claimed = await ReminderSetting.findOneAndUpdate(
            {
              _id: setting._id,
              $or: [{ lastReviewNudgeAt: null }, { lastReviewNudgeAt: { $lt: cutoff } }]
            },
            { $set: { lastReviewNudgeAt: now } }
          );
          if (claimed) {
            await sendToUser(setting.userId, {
              title: 'Time to review',
              body: 'You have ' + waiting + ' questions waiting. A few minutes now helps them stick.',
              tag: 'miimiid-review',
              url: '/'
            });
          }
        }
      }
    } catch (error) {
      console.error('Reminder tick error:', error);
    }
  }
}

function start() {
  if (timer) return;
  timer = setInterval(function () {
    tick().catch(function (error) { console.error('Reminder scheduler error:', error); });
  }, 60 * 1000);
  if (timer.unref) timer.unref();
}

module.exports = { getVapid, sendToUser, localParts, tick, start };
