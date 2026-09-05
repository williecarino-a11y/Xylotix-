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
      { id: 'rent', prompt: 'Rent', category: 'housing', visual: '🏠', answer: 'need' },
      { id: 'groceries', prompt: 'Groceries', category: 'food', visual: '🛒', answer: 'need' },
      { id: 'concert', prompt: 'Concert ticket', category: 'entertainment', visual: '🎵', answer: 'want' },
      { id: 'medicine', prompt: 'Medicine', category: 'health', visual: '💊', answer: 'need' },
      { id: 'headphones', prompt: 'New headphones', category: 'shopping', visual: '🎧', answer: 'want' },
      { id: 'emergency-savings', prompt: 'Emergency savings', category: 'saving', visual: '🛡️', answer: 'need' },
      { id: 'luxury-watch', prompt: 'Luxury watch', category: 'shopping', visual: '⌚', answer: 'want' },
      { id: 'electricity', prompt: 'Electricity bill', category: 'utilities', visual: '💡', answer: 'need' },
      { id: 'gaming-console', prompt: 'Gaming console', category: 'entertainment', visual: '🎮', answer: 'want' },
      { id: 'basic-clothing', prompt: 'Basic clothing', category: 'clothing', visual: '👕', answer: 'need' }
    ],
    answers: [
      { id: 'need', label: 'Need' },
      { id: 'want', label: 'Want' }
    ]
  },
  {
    id: 'money-match',
    type: 'multiple-choice',
    title: 'Money Match',
    subtitle: '5 quick choices. Pick the smarter money move.',
    resultTitle: 'Money Match complete',
    resultMessage: 'Keep practicing these small decisions and smart money habits become easier.',
    rounds: [
      {
        id: 'transport-buffer',
        prompt: 'You get ₦5,000 and need ₦2,000 for transport this week. What is the smarter move?',
        category: 'planning',
        visual: '🚌',
        answer: 'set-aside',
        feedback: 'Covering a known need first and keeping the rest gives you a buffer.',
        choices: [
          { id: 'spend-all', label: 'Spend the full ₦5,000 now' },
          { id: 'set-aside', label: 'Set aside the ₦2,000 and keep the remaining ₦3,000' },
          { id: 'lend-all', label: 'Lend all ₦5,000 to someone' }
        ]
      },
      {
        id: 'game-skin',
        prompt: 'You want a new game skin, but buying it would use all your spare money. What is the smarter move?',
        category: 'spending',
        visual: '🎮',
        answer: 'wait',
        feedback: 'A want can wait when buying it would wipe out your spare cash.',
        choices: [
          { id: 'buy-now', label: 'Buy it immediately' },
          { id: 'wait', label: 'Wait and keep your buffer' },
          { id: 'borrow', label: 'Borrow money for it' }
        ]
      },
      {
        id: 'unexpected-money',
        prompt: 'You receive an unexpected ₦10,000. What is a good first step?',
        category: 'saving',
        visual: '💰',
        answer: 'save-first',
        feedback: 'Saving part first turns unexpected money into a useful opportunity.',
        choices: [
          { id: 'spend-all', label: 'Spend it all because it was unexpected' },
          { id: 'save-first', label: 'Set aside part of it before spending' },
          { id: 'buy-expensive', label: 'Buy the most expensive thing you can find' }
        ]
      },
      {
        id: 'friend-loan',
        prompt: 'A friend wants to borrow money you may need tomorrow. What is the smarter move?',
        category: 'boundaries',
        visual: '🤝',
        answer: 'protect-needs',
        feedback: 'Helping others should not leave you unable to handle your own essentials.',
        choices: [
          { id: 'give-away', label: 'Give away everything you have' },
          { id: 'protect-needs', label: 'Keep enough for your own needs before deciding' },
          { id: 'borrow-to-lend', label: 'Borrow more money so you can lend it' }
        ]
      },
      {
        id: 'sale-purchase',
        prompt: 'Something is on sale, but you were not planning to buy it. What should you do?',
        category: 'spending',
        visual: '🏷️',
        answer: 'check-plan',
        feedback: 'A discount is only useful when the purchase makes sense for you.',
        choices: [
          { id: 'buy-sale', label: 'Buy it because the price is lower' },
          { id: 'check-plan', label: 'Check whether it fits your plan before buying' },
          { id: 'buy-two', label: 'Buy two because it is a sale' }
        ]
      }
    ],
    answers: []
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

module.exports = {
  getFunCenterGames,
  getFunCenterGame,
  validateFunCenterAnswer,
  getFunCenterActivities
};
