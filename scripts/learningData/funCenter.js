/**
 * Miimiid Fun Center
 *
 * DATA DEFINITIONS ONLY.
 *
 * The frontend owns presentation, animation and interaction.
 * The server owns validation and rewards.
 */

const funCenterGames = [
  {
    id: 'needs-vs-wants',

    type: 'classification',

    titleKey: 'funNeedsVsWants',

    subtitleKey: 'funNeedsVsWantsSubtitle',

    resultTitleKey: 'funRoundComplete',

    resultMessageKey: 'funNeedsVsWantsResult',

    rounds: [
      {
        id: 'rent',
        textKey: 'funNeedsVsWantsRent',
        category: 'housing',
        answer: 'need',
        visual: '🏠'
      },

      {
        id: 'groceries',
        textKey: 'funNeedsVsWantsGroceries',
        category: 'food',
        answer: 'need',
        visual: '🛒'
      },

      {
        id: 'concert',
        textKey: 'funNeedsVsWantsConcert',
        category: 'entertainment',
        answer: 'want',
        visual: '🎵'
      },

      {
        id: 'medicine',
        textKey: 'funNeedsVsWantsMedicine',
        category: 'health',
        answer: 'need',
        visual: '💊'
      },

      {
        id: 'headphones',
        textKey: 'funNeedsVsWantsHeadphones',
        category: 'shopping',
        answer: 'want',
        visual: '🎧'
      },

      {
        id: 'emergency-savings',
        textKey: 'funNeedsVsWantsEmergencySavings',
        category: 'saving',
        answer: 'need',
        visual: '🛡️'
      },

      {
        id: 'luxury-watch',
        textKey: 'funNeedsVsWantsLuxuryWatch',
        category: 'shopping',
        answer: 'want',
        visual: '⌚'
      },

      {
        id: 'electricity',
        textKey: 'funNeedsVsWantsElectricity',
        category: 'utilities',
        answer: 'need',
        visual: '💡'
      },

      {
        id: 'gaming-console',
        textKey: 'funNeedsVsWantsGamingConsole',
        category: 'entertainment',
        answer: 'want',
        visual: '🎮'
      },

      {
        id: 'basic-clothing',
        textKey: 'funNeedsVsWantsBasicClothing',
        category: 'clothing',
        answer: 'need',
        visual: '👕'
      }
    ],

    answers: [
      {
        id: 'need',
        key: 'funNeed'
      },

      {
        id: 'want',
        key: 'funWant'
      }
    ]
  },

  {
    id: 'money-match',

    type: 'multiple-choice',

    titleKey: 'funMoneyMatch',

    subtitleKey: 'funMoneyMatchSubtitle',

    resultTitleKey: 'funRoundComplete',

    resultMessageKey: 'funMoneyMatchResult',

    rounds: [
      {
        id: 'transport-buffer',
        textKey: 'funMoneyMatchTransport',
        category: 'planning',
        answer: 'set-aside',
        visual: '🚌'
      },
      {
        id: 'game-skin',
        textKey: 'funMoneyMatchGameSkin',
        category: 'spending',
        answer: 'wait',
        visual: '🎮'
      },
      {
        id: 'unexpected-money',
        textKey: 'funMoneyMatchUnexpected',
        category: 'saving',
        answer: 'save-first',
        visual: '💰'
      },
      {
        id: 'friend-loan',
        textKey: 'funMoneyMatchFriendLoan',
        category: 'boundaries',
        answer: 'protect-needs',
        visual: '🤝'
      },
      {
        id: 'sale-purchase',
        textKey: 'funMoneyMatchSale',
        category: 'spending',
        answer: 'check-plan',
        visual: '🏷️'
      }
    ],

    answers: [
      { id: 'set-aside', key: 'funMoneyMatchSetAside' },
      { id: 'wait', key: 'funMoneyMatchWait' },
      { id: 'save-first', key: 'funMoneyMatchSaveFirst' },
      { id: 'protect-needs', key: 'funMoneyMatchProtectNeeds' },
      { id: 'check-plan', key: 'funMoneyMatchCheckPlan' }
    ]
  }
];

function getFunCenterGames() {
  return funCenterGames.map(game => ({
    ...game,

    rounds: game.rounds.map(round => ({
      ...round
    })),

    answers: game.answers.map(answer => ({
      ...answer
    }))
  }));
}

function getFunCenterGame(gameId) {
  return funCenterGames.find(
    game => game.id === gameId
  );
}

function validateFunCenterAnswer(
  gameId,
  roundIndex,
  answer
) {
  const game = getFunCenterGame(gameId);

  if (!game) {
    return false;
  }

  const round = game.rounds[roundIndex];

  if (!round) {
    return false;
  }

  return round.answer === answer;
}

module.exports = {
  getFunCenterGames,
  getFunCenterGame,
  validateFunCenterAnswer
};
