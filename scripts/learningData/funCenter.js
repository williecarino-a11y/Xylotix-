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
      { id: 'milk', prompt: 'Milk', category: 'food', visual: '🥛', image: 'milk', price: 4, difficulty: 1, answer: 'need' },
      { id: 'bread', prompt: 'Bread', category: 'food', visual: '🍞', image: 'bread', price: 3, difficulty: 1, answer: 'need' },
      { id: 'chips', prompt: 'Potato chips', category: 'snacks', visual: '🍟', image: 'chips', price: 4, difficulty: 1, answer: 'want' },
      { id: 'eggs', prompt: 'Eggs (12)', category: 'food', visual: '🥚', image: 'eggs', price: 5, difficulty: 1, answer: 'need' },
      { id: 'gaming-console', prompt: 'Gaming console', category: 'entertainment', visual: '🎮', price: 300, difficulty: 1, answer: 'want' },
      { id: 'medicine', prompt: 'Medicine', category: 'health', visual: '💊', price: 12, difficulty: 2, answer: 'need' },
      { id: 'headphones', prompt: 'New headphones', category: 'shopping', visual: '🎧', price: 60, difficulty: 2, answer: 'want' },
      { id: 'pasta', prompt: 'Pasta', category: 'food', visual: '🍝', image: 'pasta', price: 2, difficulty: 2, answer: 'need' },
      { id: 'designer-sneakers', prompt: 'Designer sneakers', category: 'clothing', visual: '👟', price: 120, difficulty: 3, answer: 'want' },
      { id: 'winter-jacket', prompt: 'Basic winter jacket', category: 'clothing', visual: '🧥', price: 60, difficulty: 3, answer: 'need' }
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

module.exports = {
  getFunCenterGames,
  getFunCenterGame,
  validateFunCenterAnswer,
  getFunCenterActivities
};
