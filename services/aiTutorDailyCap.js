/*
 * MIIMIID AI TUTOR: daily message cap per user
 *
 * Protects the OpenAI bill. The default is 60 chats per user per day
 * (UTC day). Change it on Render with the env var AI_TUTOR_DAILY_LIMIT.
 * Counts are kept in memory, so they reset when the server restarts.
 */

const DEFAULT_DAILY_LIMIT = 60;
const usage = new Map();

function dailyLimit() {
  const value = parseInt(process.env.AI_TUTOR_DAILY_LIMIT, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_DAILY_LIMIT;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function aiTutorDailyCap(req, res, next) {
  const user = req.authUser || {};
  const id = String(user._id || user.id || user.email || req.ip);
  const day = today();
  const entry = usage.get(id);

  if (!entry || entry.day !== day) {
    usage.set(id, { day, count: 1 });
    return next();
  }

  if (entry.count >= dailyLimit()) {
    return res.status(429).json({
      success: false,
      code: "AI_TUTOR_DAILY_LIMIT",
      message: "You've reached today's AI Tutor limit. Please come back tomorrow."
    });
  }

  entry.count += 1;
  return next();
}

// drop yesterday's counters once an hour
setInterval(() => {
  const day = today();
  for (const [key, value] of usage) {
    if (value.day !== day) usage.delete(key);
  }
}, 60 * 60 * 1000).unref();

module.exports = aiTutorDailyCap;
