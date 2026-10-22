/**
 * Miimiid Mart LEVELS (campaign).
 *
 * Every level is its own money situation with its own rules: budget, clock, which events appear,
 * and three star goals. The server decides everything; the browser only shows it.
 *
 * Put this file next to martScenarios.js (scripts/learningData/).
 * It reuses the item prices and effects from funCenter.js, so there is one source of truth.
 *
 * To change a level, edit the LEVELS list below: budget, seconds, events, hints (the shopping list) and stars.
 *
 * Star goal tests (a goal can combine several; all must pass):
 *   save: min               keep at least this much money
 *   spentUnder: max         spend this much or less
 *   brands: min             buy this many store-brand options (milk, bread, eggs)
 *   busted: min             scan and avoid this many fake deals
 *   noFakes                 never buy a fake deal
 *   skipSale                do not buy the flash-sale item
 *   rivalOk                 beat the rival, or he never showed up
 *   balance                 every meter at the warning level or higher
 *   meter: key, min         one meter at this level or higher
 *   noWants                 buy no wants at all
 * Every goal also needs: the whole list bought and no meter at zero.
 */

const { getWeeklyShopDefinition, getWeekSetup } = require('./funCenter');

// One source of truth for how items change the meters (read from funCenter.js).
const BASE = getWeekSetup('plain-week');
const EFFECTS = BASE.effects;
const METER_START = BASE.meterStart;
const METER_WARN = BASE.meterWarn;
const METER_NAMES = { health: 'Health', happiness: 'Happiness', friends: 'Friends' };

const LEVELS = [
  {
    id: 'lvl-1', n: 1, emoji: '🧺', title: 'First Paycheck',
    story: 'Your first grocery run on your own.',
    mission: 'Fill the fridge, and see how the same food can cost less.',
    budget: 30, seconds: 150, scans: 3, bonusCoins: 20,
    events: { sale: false, hike: false, rival: false },
    situation: { hints: ['milk', 'bread', 'eggs', 'pasta'], drain: { health: 50, happiness: 30, friends: 20 } },
    stars: [
      { id: 'brands', label: 'Choose store brands for at least 2 of milk, bread and eggs', tests: [{ type: 'brands', min: 2 }], hint: 'Milk, bread and eggs have a cheaper store brand' },
      { id: 'save', label: 'Keep at least $14', tests: [{ type: 'save', min: 14 }], hint: 'Cheaper choices leave more money' }
    ]
  },
  {
    id: 'lvl-2', n: 2, emoji: '🏷️', title: 'Sale Season',
    story: 'Big signs everywhere. Some deals are real, some are tricks.',
    mission: 'Use your scanner on the deals and do not let a flash sale pull you in.',
    budget: 35, seconds: 140, scans: 3, bonusCoins: 30,
    events: { sale: true, hike: false, rival: false }, saleItem: 'pizza',
    situation: { hints: ['milk', 'bread', 'apple', 'carrot', 'water'], drain: { health: 50, happiness: 40, friends: 20 } },
    stars: [
      { id: 'bust', label: 'Scan and avoid a fake deal', tests: [{ type: 'busted', min: 1 }], hint: 'Scan a shelf deal that looks too good' },
      { id: 'resist', label: 'Skip the flash sale, never buy a fake, keep $12', tests: [{ type: 'skipSale' }, { type: 'noFakes' }, { type: 'save', min: 12 }], hint: 'A discount on a want is still spending' }
    ]
  },
  {
    id: 'lvl-3', n: 3, emoji: '🏃', title: 'Rival Aisle',
    story: 'Mom is sick. The medicine is running low and another shopper is heading for it.',
    mission: 'Get the medicine first, and watch prices that climb.',
    budget: 32, seconds: 120, scans: 3, bonusCoins: 40,
    events: { sale: false, hike: true, rival: true }, hikeItem: 'pasta', rivalItem: 'medicine',
    situation: { hints: ['medicine', 'milk', 'bread', 'pasta', 'apple'], drain: { health: 60, happiness: 35, friends: 20 } },
    stars: [
      { id: 'rival', label: 'Beat the rival to the shelf', tests: [{ type: 'rivalOk' }], hint: 'Reach the medicine before he does' },
      { id: 'save', label: 'Keep at least $5', tests: [{ type: 'save', min: 5 }], hint: 'Store brands and a fast hand keep money in your wallet' }
    ]
  },
  {
    id: 'lvl-4', n: 4, emoji: '🎉', title: "Friend's Night",
    story: "Alex's night out is tonight and you do not want to miss it.",
    mission: 'Be there for your friend, eat well, and still keep some money.',
    budget: 42, seconds: 130, scans: 3, bonusCoins: 50,
    events: { sale: false, hike: true, rival: false }, hikeItem: 'water',
    situation: { hints: ['movie', 'milk', 'bread', 'eggs', 'apple'], drain: { health: 45, happiness: 40, friends: 50 } },
    stars: [
      { id: 'balance', label: `Every meter at ${METER_WARN} or more`, tests: [{ type: 'balance' }], hint: 'Health and Happiness also need a boost' },
      { id: 'save', label: 'Keep at least $10', tests: [{ type: 'save', min: 10 }], hint: 'Cheap boosts and store brands add up' }
    ]
  },
  {
    id: 'lvl-5', n: 5, emoji: '🏠', title: 'Rent Week',
    story: 'Rent took most of your pay. Every dollar counts.',
    mission: 'Stretch a tiny budget while prices rise and deals try to tempt you.',
    budget: 26, seconds: 110, scans: 3, bonusCoins: 60,
    events: { sale: true, hike: true, rival: false }, saleItem: 'pizza', hikeItem: 'apple',
    situation: { hints: ['milk', 'bread', 'eggs', 'pasta', 'apple', 'carrot'], drain: { health: 50, happiness: 35, friends: 20 } },
    stars: [
      { id: 'frugal', label: 'Spend $21 or less', tests: [{ type: 'spentUnder', max: 21 }], hint: 'Store brands are your friend' },
      { id: 'bust', label: 'Scan and avoid 2 fake deals, skip the sale', tests: [{ type: 'busted', min: 2 }, { type: 'skipSale' }], hint: 'Use your scans on the deals that look best' }
    ]
  },
  {
    id: 'lvl-6', n: 6, emoji: '🌪️', title: 'Payday Chaos',
    story: 'Everything goes wrong at once: a rival, a price rise, a flash sale and fake deals.',
    mission: 'Stay calm, protect the essentials and finish with money in your wallet.',
    budget: 34, seconds: 100, scans: 2, bonusCoins: 100,
    events: { sale: true, hike: true, rival: true }, saleItem: 'pizza', hikeItem: 'pasta', rivalItem: 'medicine',
    situation: { hints: ['medicine', 'milk', 'bread', 'eggs', 'pasta'], drain: { health: 60, happiness: 45, friends: 40 } },
    stars: [
      { id: 'calm', label: 'Beat the rival and never buy a fake deal', tests: [{ type: 'rivalOk' }, { type: 'noFakes' }], hint: 'Medicine first, and trust your scanner' },
      { id: 'save', label: 'Keep at least $7 and skip the sale', tests: [{ type: 'save', min: 7 }, { type: 'skipSale' }], hint: 'Chaos is when impulse buys cost the most' }
    ]
  }
];

const PERFECT_BONUS = 25;     // extra coins the first time a level is finished with 3 stars
const UNLOCK_STARS = 2;       // stars needed on a level to open the next one

// Every level gets the same first goal: cover the whole list and stay standing.
const COVER_ROW = { id: 'cover', label: 'Cover your whole list and keep every meter above zero' };

function getLevel(id) {
  if (!id) return null;
  return LEVELS.find(l => l.id === id) || null;
}

function getNextLevel(level) {
  if (!level) return null;
  return LEVELS.find(l => l.n === level.n + 1) || null;
}

function levelBySituation(situationId) {
  return LEVELS.find(l => l.id === situationId) || null;
}

// The day card for a level, in the same shape as getWeekSetup() so the browser needs no changes.
function levelWeekSetup(level) {
  return {
    situation: {
      id: level.id, emoji: level.emoji, title: level.title, story: level.story, mission: level.mission,
      hints: level.situation.hints.slice(), drain: { ...level.situation.drain }
    },
    effects: JSON.parse(JSON.stringify(EFFECTS)),
    meterStart: METER_START,
    meterWarn: METER_WARN
  };
}

function computeLevelMeters(level, itemIds) {
  const d = level.situation.drain;
  const m = { health: METER_START - d.health, happiness: METER_START - d.happiness, friends: METER_START - d.friends };
  (itemIds || []).forEach(id => {
    const e = EFFECTS[id];
    if (!e) return;
    Object.keys(e).forEach(key => { m[key] += e[key]; });
  });
  Object.keys(m).forEach(key => { m[key] = Math.max(0, Math.min(100, m[key])); });
  return m;
}

// What the browser may see about a level (never the exact tests).
function publicLevel(level, progress) {
  const p = progress || {};
  return {
    id: level.id, n: level.n, emoji: level.emoji, title: level.title, story: level.story, mission: level.mission,
    budget: level.budget, seconds: level.seconds, scans: level.scans, bonusCoins: level.bonusCoins,
    events: { ...level.events },
    hints: level.situation.hints.slice(),
    goals: [COVER_ROW.label].concat(level.stars.map(s => s.label)),
    bestStars: p.best || 0,
    plays: p.plays || 0
  };
}

// progressRows: [{ _id: 'lvl-1', best: 2, plays: 3 }, ...]
function levelsForUser(progressRows) {
  const byId = {};
  (progressRows || []).forEach(r => { byId[r._id] = r; });
  return LEVELS.map(level => {
    const prev = LEVELS.find(l => l.n === level.n - 1);
    const prevBest = prev && byId[prev.id] ? byId[prev.id].best || 0 : 0;
    const unlocked = level.n === 1 || prevBest >= UNLOCK_STARS;
    return { ...publicLevel(level, byId[level.id]), unlocked, unlockHint: unlocked ? '' : `Earn ${UNLOCK_STARS} stars on level ${level.n - 1}` };
  });
}

function isUnlocked(level, progressRows) {
  const row = levelsForUser(progressRows).find(l => l.id === level.id);
  return !!(row && row.unlocked);
}

function runTest(test, info) {
  switch (test.type) {
    case 'save': return info.saved >= test.min;
    case 'spentUnder': return info.spent <= test.max;
    case 'brands': return info.brandCount >= test.min;
    case 'busted': return info.bustedCount >= test.min;
    case 'noFakes': return info.fellCount === 0;
    case 'skipSale': return !info.saleItemId || !info.boughtIds.has(info.saleItemId);
    case 'rivalOk': return !info.rivalItemId || !!info.rivalBeaten;
    case 'balance': return info.meters ? Math.min(info.meters.health, info.meters.happiness, info.meters.friends) >= METER_WARN : false;
    case 'meter': return !!info.meters && info.meters[test.key] >= test.min;
    case 'noWants': return info.wantsCount === 0;
    default: return false;
  }
}

// info: { boughtIds:Set, bought:[{itemId,optionId,price}], meters, burnedOut:[], saved, spent, wantsCount,
//         trickReport:[{status}], rivalItemId, rivalBeaten, saleItemId }
function judgeLevel(levelId, info) {
  const level = getLevel(levelId);
  if (!level) return null;
  const hints = level.situation.hints;
  const missing = hints.filter(id => !info.boughtIds.has(id));
  const alive = !info.burnedOut || info.burnedOut.length === 0;
  const baseOk = missing.length === 0 && alive;

  const shop = getWeeklyShopDefinition();
  const nameOf = id => { const it = shop.items.find(i => i.id === id); return it ? it.name : id; };
  const brandCount = (info.bought || []).filter(entry => {
    const item = shop.items.find(i => i.id === entry.itemId);
    const opt = item && Array.isArray(item.options) ? item.options.find(o => o.id === entry.optionId) : null;
    return !!opt && opt.tier === 'budget';
  }).length;
  const rows = (info.trickReport || []);
  const full = {
    ...info,
    brandCount,
    bustedCount: rows.filter(r => r.status === 'busted').length,
    fellCount: rows.filter(r => r.status === 'fell').length
  };

  const out = [{
    id: COVER_ROW.id, label: COVER_ROW.label, earned: baseOk,
    hint: !alive ? `Your ${info.burnedOut.map(k => METER_NAMES[k]).join(' and ')} meter hit zero`
      : `Still missing: ${missing.map(nameOf).join(', ')}`
  }];
  level.stars.forEach(star => {
    const passes = star.tests.every(t => runTest(t, full));
    out.push({
      id: star.id, label: star.label, earned: baseOk && passes,
      hint: baseOk ? star.hint : 'Cover your whole list first'
    });
  });
  return out;
}

module.exports = {
  LEVELS, PERFECT_BONUS, UNLOCK_STARS, METER_WARN,
  getLevel, getNextLevel, levelBySituation, levelWeekSetup, computeLevelMeters,
  publicLevel, levelsForUser, isUnlocked, judgeLevel
};
