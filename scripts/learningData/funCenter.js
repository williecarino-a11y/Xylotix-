/**
 * Miimiid Fun Center
 *
 * DATA DEFINITIONS ONLY.
 *
 * The server owns game content, validation and rewards.
 * The frontend renders the data returned by the Fun Center API.
 */

const funCenterGames = [
  {
    id: 'needs-vs-wants',
    type: 'classification',
    title: 'Needs vs Wants',
    subtitle: 'Sort everyday spending into needs and wants.',
    resultTitle: 'Round complete',
    resultMessage: 'You are getting better at separating essentials from extras.',
    rounds: [
      { id: 'milk', prompt: 'Milk', category: 'food', visual: '🥛', image: 'milk', price: 4, difficulty: 1, answer: 'need', explanation: 'Milk is a need: an everyday staple you use every week.' },
      { id: 'bread', prompt: 'Bread', category: 'food', visual: '🍞', image: 'bread', price: 3, difficulty: 1, answer: 'need', explanation: 'Bread is a need: cheap, filling food for the whole week.' },
      { id: 'chips', prompt: 'Potato chips', category: 'snacks', visual: '🍟', image: 'chips', price: 4, difficulty: 1, answer: 'want', explanation: 'Chips are a want: tasty, but your body does not need them.' },
      { id: 'eggs', prompt: 'Eggs (12)', category: 'food', visual: '🥚', image: 'eggs', price: 5, difficulty: 1, answer: 'need', explanation: 'Eggs are a need: affordable protein that stretches your budget.' },
      { id: 'gaming-console', prompt: 'Gaming console', category: 'entertainment', visual: '🎮', price: 300, difficulty: 1, answer: 'want', explanation: 'A $300 console is a want: fun, but you can live well without it.' },
      { id: 'medicine', prompt: 'Medicine', category: 'health', visual: '💊', price: 12, difficulty: 2, answer: 'need', explanation: 'Medicine is a need: your health always comes first.' },
      { id: 'headphones', prompt: 'New headphones', category: 'shopping', visual: '🎧', price: 60, difficulty: 2, answer: 'want', explanation: 'New headphones are a want: nice to have, and worth waiting for if your old pair still works.' },
      { id: 'pasta', prompt: 'Pasta', category: 'food', visual: '🍝', image: 'pasta', price: 2, difficulty: 2, answer: 'need', explanation: 'Pasta is a need: very cheap food that fills you up.' },
      { id: 'designer-sneakers', prompt: 'Designer sneakers', category: 'clothing', visual: '👟', price: 120, difficulty: 3, answer: 'want', explanation: 'Designer sneakers are a want: you need shoes, not the brand name.' },
      { id: 'winter-jacket', prompt: 'Basic winter jacket', category: 'clothing', visual: '🧥', price: 60, difficulty: 3, answer: 'need', explanation: 'A basic jacket is a need: staying warm protects your health.' }
    ],
    answers: [
      { id: 'need', label: 'Need' },
      { id: 'want', label: 'Want' }
    ]
  }
];

function getFunCenterGames() {
  return funCenterGames.map((game) => ({
    ...game,
    rounds: game.rounds.map((round) => ({
      ...round,
      choices: Array.isArray(round.choices)
        ? round.choices.map((choice) => ({ ...choice }))
        : undefined
    })),
    answers: Array.isArray(game.answers)
      ? game.answers.map((answer) => ({ ...answer }))
      : []
  }));
}

function getFunCenterGame(gameId) {
  return funCenterGames.find((game) => game.id === gameId);
}

function validateFunCenterAnswer(gameId, roundIndex, answer) {
  const game = getFunCenterGame(gameId);
  if (!game) return false;
  const round = game.rounds[roundIndex];
  if (!round) return false;
  return round.answer === answer;
}

const funCenterActivities = [
  {
    id: 'needs-vs-wants',
    titleKey: 'funCenterNeedsWantsTitle',
    resultTitleKey: 'funCenterNeedsWantsResultTitle',
    resultMessageKey: 'funCenterNeedsWantsResultMessage',
    answers: [
      { id: 'need', key: 'funCenterAnswerNeed' },
      { id: 'want', key: 'funCenterAnswerWant' }
    ],
    rounds: [
      { id: 'rent', textKey: 'funCenterRoundRent', visual: '🏠', answer: 'need' },
      { id: 'groceries', textKey: 'funCenterRoundGroceries', visual: '🛒', answer: 'need' },
      { id: 'concert', textKey: 'funCenterRoundConcert', visual: '🎵', answer: 'want' },
      { id: 'medicine', textKey: 'funCenterRoundMedicine', visual: '💊', answer: 'need' },
      { id: 'headphones', textKey: 'funCenterRoundHeadphones', visual: '🎧', answer: 'want' },
      { id: 'savings', textKey: 'funCenterRoundSavings', visual: '🛡️', answer: 'need' },
      { id: 'watch', textKey: 'funCenterRoundWatch', visual: '⌚', answer: 'want' },
      { id: 'electricity', textKey: 'funCenterRoundElectricity', visual: '💡', answer: 'need' },
      { id: 'console', textKey: 'funCenterRoundConsole', visual: '🎮', answer: 'want' },
      { id: 'clothing', textKey: 'funCenterRoundClothing', visual: '👕', answer: 'need' }
    ]
  }
];

function getFunCenterActivities() {
  return funCenterActivities.map((activity) => ({
    ...activity,
    answers: activity.answers.map((answer) => ({ ...answer })),
    rounds: activity.rounds.map((round) => ({ ...round }))
  }));
}

const weeklyShop = {
  id: 'weekly-shop',
  title: 'Weekly Shop',
  subtitle: 'You have $40 for this week. Spend it wisely.',
  budget: 40,
  items: [
    {
      id: 'milk', name: 'Milk', price: 4, image: 'milk', visual: '🥛', classification: 'need', explanation: 'Milk is a need: a weekly staple.',
      options: [
        { id: 'premium', label: 'Organic', tier: 'premium', price: 7, note: 'Nicer, but you pay extra for the same job.' },
        { id: 'regular', label: 'Regular', tier: 'regular', price: 4, note: 'The everyday choice.' },
        { id: 'budget', label: 'Store brand', tier: 'budget', price: 3, note: 'Does the same job for less.' }
      ]
    },
    {
      id: 'bread', name: 'Bread', price: 3, image: 'bread', visual: '🍞', classification: 'need', explanation: 'Bread is a need: cheap, filling food.',
      options: [
        { id: 'premium', label: 'Bakery', tier: 'premium', price: 6, note: 'Nicer, but you pay extra for the same job.' },
        { id: 'regular', label: 'Regular', tier: 'regular', price: 3, note: 'The everyday choice.' },
        { id: 'budget', label: 'Store brand', tier: 'budget', price: 2, note: 'Does the same job for less.' }
      ]
    },
    {
      id: 'eggs', name: 'Eggs (12)', price: 5, image: 'eggs', visual: '🥚', classification: 'need', explanation: 'Eggs are a need: affordable protein.',
      options: [
        { id: 'premium', label: 'Free-range', tier: 'premium', price: 8, note: 'Nicer, but you pay extra for the same job.' },
        { id: 'regular', label: 'Regular', tier: 'regular', price: 5, note: 'The everyday choice.' },
        { id: 'budget', label: 'Store brand', tier: 'budget', price: 4, note: 'Does the same job for less.' }
      ]
    },
    { id: 'pasta', name: 'Pasta', price: 2, image: 'pasta', visual: '🍝', classification: 'need', explanation: 'Pasta is a need: very cheap and filling.' },
    { id: 'apple', name: 'Apples', price: 3, image: 'apple', visual: '🍎', classification: 'need', explanation: 'Apples are a need: healthy food for the week.' },
    { id: 'carrot', name: 'Carrots', price: 2, image: 'carrot', visual: '🥕', classification: 'need', explanation: 'Carrots are a need: cheap vegetables.' },
    { id: 'water', name: 'Water', price: 2, image: 'water', visual: '💧', classification: 'need', explanation: 'Water is a need: your body requires it every day.' },
    { id: 'medicine', name: 'Medicine', price: 12, visual: '💊', classification: 'need', explanation: 'Medicine is a need: your health comes first.' },
    { id: 'chips', name: 'Potato chips', price: 4, image: 'chips', visual: '🍟', classification: 'want', explanation: 'Chips are a want: tasty, but not essential.' },
    { id: 'cookies', name: 'Cookies', price: 5, visual: '🍪', classification: 'want', explanation: 'Cookies are a want: a treat, not a necessity.' },
    { id: 'pizza', name: 'Pizza night', price: 9, visual: '🍕', classification: 'want', explanation: 'Pizza night is a want: groceries cost far less per meal.' },
    { id: 'candy', name: 'Candy', price: 3, visual: '🍬', classification: 'want', explanation: 'Candy is a want: small, but it adds up.' },
    { id: 'movie', name: 'Movie ticket', price: 12, visual: '🎬', classification: 'want', explanation: 'A movie ticket is a want: fun, but not essential.' },
    { id: 'headphones', name: 'Headphones', price: 60, visual: '🎧', classification: 'want', explanation: 'Headphones are a want: nice, but you can wait.' },
    { id: 'console', name: 'Gaming console', price: 300, visual: '🎮', classification: 'want', explanation: 'A console is a want: a big purchase to save up for.' },
    { id: 'sneakers', name: 'Designer sneakers', price: 120, visual: '👟', classification: 'want', explanation: 'Designer sneakers are a want: you need shoes, not the brand.' }
  ]
};

// Flash sales: only on wants, so the discount tests self-control.
// The server picks one that is not already in the basket.
const flashSales = [
  { itemId: 'headphones', salePrice: 30, label: '50% OFF', seconds: 25 },
  { itemId: 'pizza', salePrice: 5, label: 'SALE', seconds: 25 },
  { itemId: 'movie', salePrice: 7, label: 'SALE', seconds: 25 }
];

function getFlashSales() {
  return flashSales.map(sale => ({ ...sale }));
}

// Price rises: only on essentials with no price options. Small enough that every essential stays affordable.
const priceHikes = [
  { itemId: 'pasta', newPrice: 4 },
  { itemId: 'apple', newPrice: 5 },
  { itemId: 'carrot', newPrice: 4 },
  { itemId: 'water', newPrice: 4 },
  { itemId: 'medicine', newPrice: 15 }
];

function getPriceHikes() {
  return priceHikes.map(hike => ({ ...hike }));
}

function getWeeklyShop() {
  return {
    id: weeklyShop.id,
    title: weeklyShop.title,
    subtitle: weeklyShop.subtitle,
    budget: weeklyShop.budget,
    items: weeklyShop.items.map(({ id, name, price, image, visual, options }) => ({
      id,
      name,
      price,
      image,
      visual,
      options: Array.isArray(options)
        ? options.map(option => ({ id: option.id, label: option.label, price: option.price, tier: option.tier, note: option.note }))
        : undefined
    }))
  };
}

function getWeeklyShopDefinition() {
  return weeklyShop;
}

// Survive the Week: how items change three meters, and the day cards.
const METER_START = 50;
const METER_WARN = 30;
const itemEffects = {
  milk: { health: 6 }, bread: { health: 6 }, eggs: { health: 6 }, pasta: { health: 6 },
  apple: { health: 6 }, carrot: { health: 6 }, water: { health: 4 }, medicine: { health: 25 },
  chips: { happiness: 5 }, cookies: { happiness: 6 }, candy: { happiness: 5 }, pizza: { happiness: 12 },
  movie: { happiness: 15, friends: 35 }, headphones: { happiness: 20 }, console: { happiness: 30 }, sneakers: { happiness: 20 }
};
const situations = [
  {
    id: 'sick-day', emoji: '🤒', title: 'Sick day',
    story: 'Mom has a fever and the fridge is empty.',
    mission: 'Look after her first, then look after yourself. $40 until payday.',
    hints: ['medicine', 'milk', 'bread', 'pasta'],
    drain: { health: 60, happiness: 35, friends: 20 }
  },
  {
    id: 'birthday', emoji: '🎂', title: 'Birthday Friday',
    story: "Alex's birthday night is tonight.",
    mission: 'Show up for your friend and still eat well. $40 until payday.',
    hints: ['movie', 'milk', 'bread', 'eggs', 'apple'],
    drain: { health: 45, happiness: 40, friends: 50 }
  },
  {
    id: 'plain-week', emoji: '🛒', title: 'Plain week',
    story: 'Nothing special happens this week.',
    mission: 'Keep every part of your life going. $40 until payday.',
    hints: ['milk', 'bread', 'apple', 'carrot', 'water'],
    drain: { health: 50, happiness: 40, friends: 20 }
  }
];

function getSituation(id) {
  return situations.find(s => s.id === id) || null;
}

function pickSituation() {
  return situations[Math.floor(Math.random() * situations.length)];
}

function computeMeters(situationId, itemIds) {
  const sit = getSituation(situationId);
  if (!sit) return null;
  const m = {
    health: METER_START - sit.drain.health,
    happiness: METER_START - sit.drain.happiness,
    friends: METER_START - sit.drain.friends
  };
  (itemIds || []).forEach(id => {
    const e = itemEffects[id];
    if (!e) return;
    Object.keys(e).forEach(key => { m[key] += e[key]; });
  });
  Object.keys(m).forEach(key => { m[key] = Math.max(0, Math.min(100, m[key])); });
  return m;
}

function getWeekSetup(situationId) {
  const sit = getSituation(situationId);
  if (!sit) return null;
  return {
    situation: { id: sit.id, emoji: sit.emoji, title: sit.title, story: sit.story, mission: sit.mission, hints: sit.hints.slice(), drain: { ...sit.drain } },
    effects: JSON.parse(JSON.stringify(itemEffects)),
    meterStart: METER_START,
    meterWarn: METER_WARN
  };
}

// Trick Store: deals on the shelf that may be fake. The scanner (3 per trip) reveals the truth.
const TRICK_POOL = ['chips', 'cookies', 'candy', 'pasta', 'apple', 'carrot', 'water'];
const TRICK_KINDS = ['real-sale', 'fake-sale', 'fake-sale', 'fake-urgent'];
const SCANS_PER_TRIP = 3;

function pickTricks() {
  const ids = TRICK_POOL.slice();
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return TRICK_KINDS.map((kind, i) => {
    const item = weeklyShop.items.find(it => it.id === ids[i]);
    const base = item.price;
    return {
      itemId: item.id,
      kind,
      price: kind === 'real-sale' ? Math.max(1, Math.round(base * 0.7)) : base,
      claimed: kind === 'fake-sale' ? base * 2 : base,
      scanned: false
    };
  });
}

// What the shelves show. The kind (fake or real) is never sent to the browser.
function publicTricks(tricks) {
  return (tricks || []).map(t => ({
    itemId: t.itemId,
    badge: t.kind === 'fake-urgent' ? 'ONLY 2 LEFT!' : (t.kind === 'fake-sale' ? '50% OFF' : 'SALE'),
    was: t.kind === 'fake-urgent' ? null : t.claimed,
    price: t.price,
    urgent: t.kind === 'fake-urgent'
  }));
}

function describeTrick(trick, item) {
  const base = item.price;
  if (trick.kind === 'real-sale') {
    return {
      verdict: 'real', itemId: item.id, name: item.name, title: 'Real deal! ✅',
      detail: `${item.name} usually costs $${base} and today it is $${trick.price}. This discount is real.`
    };
  }
  if (trick.kind === 'fake-sale') {
    return {
      verdict: 'fake', itemId: item.id, name: item.name, title: 'BUSTED! Fake discount 🚫',
      detail: `The tag says "was $${trick.claimed}", but ${item.name} always costs $${base}. The old price was invented.`
    };
  }
  return {
    verdict: 'fake', itemId: item.id, name: item.name, title: 'BUSTED! Fake pressure 🚫',
    detail: `The back room is full of ${item.name}. "Only 2 left" is just pressure to make you rush.`
  };
}

module.exports = {
  getFunCenterGames,
  getFunCenterGame,
  validateFunCenterAnswer,
  getFunCenterActivities,
  getWeeklyShop,
  getWeeklyShopDefinition,
  getFlashSales,
  getPriceHikes,
  getWeekSetup,
  pickSituation,
  computeMeters,
  METER_WARN
};
