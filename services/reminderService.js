const webpush = require('web-push');

const PushConfig = require('../models/PushConfig');
const PushSubscription = require('../models/PushSubscription');
const ReminderSetting = require('../models/ReminderSetting');
const InboxNotification = require('../models/InboxNotification');
const UserProgress = require('../models/UserProgress');
const learningService = require('./learningService');

// If the server was asleep at the exact minute, still send within this many minutes
const LATE_WINDOW_MINUTES = 120;

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

async function sendToUser(userId, payload) {
  await getVapid();
  const subscriptions = await PushSubscription.find({ userId });
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

// Returns the message to send, or null if the user already learned today
async function reminderFor(userId, timeZone, now) {
  const progress = await UserProgress.find({ userId, completed: true }).sort({ completedAt: 1 });
  const today = localParts(now, timeZone).dateKey;

  const learnedToday = progress.some(function (p) {
    return p.completedAt && localParts(p.completedAt, timeZone).dateKey === today;
  });
  if (learnedToday) return null;

  const streak = learningService.calculateStreak(progress);

  if (streak >= 1) {
    return {
      title: 'Keep your streak going',
      body: "You're on a " + streak + '-day streak. One lesson today keeps it alive.',
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
      const late = local.minutes - (setting.hour * 60 + setting.minute);

      if (late < 0 || late > LATE_WINDOW_MINUTES) continue;
      if (setting.lastSentDate === local.dateKey) continue;

      const subscriptionCount = await PushSubscription.countDocuments({ userId: setting.userId });
      if (!subscriptionCount) continue;

      // Claim today's reminder first so it can never be sent twice
      const claimed = await ReminderSetting.findOneAndUpdate(
        { _id: setting._id, lastSentDate: { $ne: local.dateKey } },
        { $set: { lastSentDate: local.dateKey } }
      );
      if (!claimed) continue;

      const message = await reminderFor(setting.userId, zone, now);
      if (!message) continue;

      await sendToUser(setting.userId, message);
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
