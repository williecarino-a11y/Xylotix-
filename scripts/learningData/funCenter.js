/**
 * Miimiid Fun Center activity data.
 *
 * This file contains activity DATA only.
 * Rendering and interaction logic belong to the frontend.
 *
 * User-facing text is represented by localization keys so
 * the frontend localization system remains authoritative.
 */

const funCenterActivities = [
  {
    id: 'needs-vs-wants',
    titleKey: 'funNeedsVsWants',
    resultTitleKey: 'funRoundComplete',
    resultMessageKey: 'funNeedsVsWantsResult',
    answers: [
      {
        id: 'need',
        key: 'funNeed'
      },
      {
        id: 'want',
        key: 'funWant'
      }
    ],
    rounds: [
      {
        id: 'rent',
        textKey: 'funNeedsVsWantsRent',
        answer: 'need'
      },
      {
        id: 'groceries',
        textKey: 'funNeedsVsWantsGroceries',
        answer: 'need'
      },
      {
        id: 'concert',
        textKey: 'funNeedsVsWantsConcert',
        answer: 'want'
      },
      {
        id: 'medicine',
        textKey: 'funNeedsVsWantsMedicine',
        answer: 'need'
      },
      {
        id: 'headphones',
        textKey: 'funNeedsVsWantsHeadphones',
        answer: 'want'
      }
    ]
  }
];

function getFunCenterActivities() {
  return funCenterActivities.map(activity => ({
    ...activity,
    rounds: activity.rounds.map(round => ({
      ...round
    }))
  }));
}

module.exports = {
  getFunCenterActivities
};
