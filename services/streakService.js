const StreakState = require('../models/StreakState');
const UserProgress = require('../models/UserProgress');

const MAX_FREEZES = 2;
const MIN_RUN_TO_PROTECT = 3;
const DAY = 86400000;

function validTimezone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
}

// The date (YYYY-MM-DD) in the learner's own time zone
function keyIn(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function addDays(key, n) {
  return new Date(Date.parse(key + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / DAY);
}

async function getState(userId) {
  try {
    return await StreakState.findOneAndUpdate(
      { userId },
      { $setOnInsert: { freezes: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error && error.code === 11000) return StreakState.findOne({ userId });
    throw error;
  }
}

/*
 * Works out the current streak (counting frozen days), uses a freeze automatically
 * when a streak of 3+ days would otherwise break, and awards a freeze every 7 days.
 */
async function evaluate(userId, timeZoneHint, retry) {
  let state = await getState(userId);

  let tz = 'UTC';
  if (validTimezone(timeZoneHint)) tz = timeZoneHint;
  else if (validTimezone(state.timezone)) tz = state.timezone;

  if (validTimezone(timeZoneHint) && state.timezone !== tz) {
    state = (await StreakState.findOneAndUpdate({ userId }, { $set: { timezone: tz } }, { new: true })) || state;
  }

  const now = new Date();
  const today = keyIn(now, tz);
  const yesterday = addDays(today, -1);

  const progress = await UserProgress.find({ userId, completed: true, completedAt: { $ne: null } }).select('completedAt');
  const real = new Set(progress.map(function (p) { return keyIn(p.completedAt, tz); }));

  if (!real.size) {
    return { streak: 0, freezes: state.freezes, learnedToday: false, tz, today };
  }

  const active = new Set(real);
  (state.frozenDays || []).forEach(function (d) { active.add(d); });

  function runEnding(endKey) {
    let n = 0;
    let d = endKey;
    while (active.has(d) && n < 3650) { n += 1; d = addDays(d, -1); }
    return n;
  }

  const last = Array.from(real).sort().pop();

  /* ----- protect a streak with a freeze if days were missed ----- */
  if (daysBetween(last, yesterday) > 0 && daysBetween(last, yesterday) <= 14) {
    const missed = [];
    for (let d = addDays(last, 1); d <= yesterday; d = addDays(d, 1)) {
      if (!active.has(d)) missed.push(d);
    }

    if (missed.length && missed.length <= state.freezes && runEnding(last) >= MIN_RUN_TO_PROTECT) {
      const updated = await StreakState.findOneAndUpdate(
        { userId, freezes: { $gte: missed.length }, frozenDays: { $nin: missed } },
        {
          $inc: { freezes: -missed.length, noticeFreezes: missed.length },
          $addToSet: { frozenDays: { $each: missed } }
        },
        { new: true }
      );

      if (updated) {
        state = updated;
        missed.forEach(function (d) { active.add(d); });
      } else if (!retry) {
        // Another request applied it first: start again with the fresh state
        return evaluate(userId, tz, true);
      }
    }
  }

  /* ----- the current streak ----- */
  let streak = 0;
  let cursor = active.has(today) ? today : (active.has(yesterday) ? yesterday : null);
  while (cursor && active.has(cursor) && streak < 3650) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  /* ----- earn a freeze at every 7 days ----- */
  if (streak < 7) {
    if (state.awardedMilestone > 0) {
      await StreakState.updateOne({ userId, awardedMilestone: { $gt: 0 } }, { $set: { awardedMilestone: 0 } });
    }
  } else {
    const milestone = Math.floor(streak / 7) * 7;
    if (milestone > (state.awardedMilestone || 0)) {
      let awarded = await StreakState.findOneAndUpdate(
        { userId, awardedMilestone: { $lt: milestone }, freezes: { $lt: MAX_FREEZES } },
        { $inc: { freezes: 1, noticeEarned: 1 }, $set: { awardedMilestone: milestone } },
        { new: true }
      );
      if (!awarded) {
        awarded = await StreakState.findOneAndUpdate(
          { userId, awardedMilestone: { $lt: milestone } },
          { $set: { awardedMilestone: milestone } },
          { new: true }
        );
      }
      if (awarded) state = awarded;
    }
  }

  return { streak, freezes: state.freezes, learnedToday: real.has(today), tz, today };
}

async function getStreak(userId) {
  const result = await evaluate(userId);
  return result.streak;
}

// Returns what the learner has not been told yet, and clears it
async function consumeNotices(userId) {
  const old = await StreakState.findOneAndUpdate(
    { userId, $or: [{ noticeFreezes: { $gt: 0 } }, { noticeEarned: { $gt: 0 } }] },
    { $set: { noticeFreezes: 0, noticeEarned: 0 } },
    { new: false }
  );
  return {
    freezeUsed: old ? old.noticeFreezes || 0 : 0,
    freezeEarned: old ? old.noticeEarned || 0 : 0
  };
}

module.exports = { evaluate, getStreak, consumeNotices, keyIn, validTimezone, MAX_FREEZES };
