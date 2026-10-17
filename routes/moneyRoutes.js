const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const MoneyPlan = require('../models/MoneyPlan');

const CURRENCIES = ['\u20A6', '$', '\u00A3', '\u20AC', 'GH\u20B5', 'KSh', 'R'];
const MAX_AMOUNT = 1e12;

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

function cleanId(value) {
  const s = typeof value === 'string' ? value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) : '';
  return s || crypto.randomBytes(6).toString('hex');
}

function cleanAmount(value, allowZero) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > MAX_AMOUNT) return null;
  if (!allowZero && n === 0) return null;
  return Math.round(n * 100) / 100;
}

function cleanBudget(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const income = cleanAmount(raw.income == null ? 0 : raw.income, true);
  if (income === null) return null;
  if (!Array.isArray(raw.items) || raw.items.length > 40) return null;

  const items = [];
  for (const item of raw.items) {
    if (!item || typeof item !== 'object') return null;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const amount = cleanAmount(item.amount, true);
    if (!name || name.length > 40 || amount === null) return null;
    items.push({ id: cleanId(item.id), name, amount });
  }
  return { income, items };
}

function cleanGoals(raw) {
  if (!Array.isArray(raw) || raw.length > 10) return null;

  const goals = [];
  for (const goal of raw) {
    if (!goal || typeof goal !== 'object') return null;
    const name = typeof goal.name === 'string' ? goal.name.trim() : '';
    const target = cleanAmount(goal.target, false);
    const saved = cleanAmount(goal.saved == null ? 0 : goal.saved, true);
    if (!name || name.length > 60 || target === null || saved === null) return null;

    let deadline = null;
    if (goal.deadline) {
      const text = String(goal.deadline);
      const parsed = new Date(text + 'T00:00:00.000Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(parsed.getTime())) return null;
      deadline = text;
    }
    goals.push({ id: cleanId(goal.id), name, target, saved, deadline });
  }
  return goals;
}

module.exports = function createMoneyRoutes({ requireAuth }) {
  const router = express.Router();

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => fail(res, 429, 'MONEY_RATE_LIMITED', 'Too many changes. Please wait a few minutes.')
  });

  async function save(userId, fields) {
    return MoneyPlan.findOneAndUpdate(
      { userId },
      { $set: fields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  router.get('/', requireAuth, async function (req, res) {
    try {
      const doc = await MoneyPlan.findOne({ userId: req.authUser._id });
      return res.status(200).json({
        status: 'success',
        data: {
          currency: doc && doc.currency ? doc.currency : '',
          budget: doc && doc.budget ? doc.budget : { income: 0, items: [] },
          goals: doc && Array.isArray(doc.goals) ? doc.goals : []
        }
      });
    } catch (error) {
      console.error('Money load error:', error);
      return fail(res, 500, 'MONEY_LOAD_FAILED', 'Unable to load your money tools.');
    }
  });

  router.put('/budget', requireAuth, writeLimiter, async function (req, res) {
    try {
      const budget = cleanBudget(req.body && req.body.budget);
      if (!budget) return fail(res, 400, 'INVALID_BUDGET', 'Check your budget numbers and try again.');
      await save(req.authUser._id, { budget });
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Budget save error:', error);
      return fail(res, 500, 'BUDGET_SAVE_FAILED', 'Unable to save your budget.');
    }
  });

  router.put('/goals', requireAuth, writeLimiter, async function (req, res) {
    try {
      const goals = cleanGoals(req.body && req.body.goals);
      if (!goals) return fail(res, 400, 'INVALID_GOALS', 'Check your goal details and try again.');
      await save(req.authUser._id, { goals });
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Goals save error:', error);
      return fail(res, 500, 'GOALS_SAVE_FAILED', 'Unable to save your goals.');
    }
  });

  router.put('/currency', requireAuth, writeLimiter, async function (req, res) {
    try {
      const currency = req.body && req.body.currency;
      if (CURRENCIES.indexOf(currency) === -1) return fail(res, 400, 'INVALID_CURRENCY', 'Choose a currency from the list.');
      await save(req.authUser._id, { currency });
      return res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Currency save error:', error);
      return fail(res, 500, 'CURRENCY_SAVE_FAILED', 'Unable to save your currency.');
    }
  });

  return router;
};
