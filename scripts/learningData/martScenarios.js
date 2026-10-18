/**
 * Miimiid Mart lesson scenarios.
 *
 * A lesson can end with one short Mart trip built around one decision.
 * The server picks the day card and the one event, and judges the result.
 *
 * lessonKeywords: a lesson gets this scenario when its title contains
 * any of these words (not case-sensitive). Edit the words to match your lessons.
 */

const MART_SCENARIOS = [
  {
    id: 'sale-trap',
    lessonKeywords: ['needs vs wants', 'needs and wants', 'wants'],
    situationId: 'plain-week',
    event: 'sale',
    itemId: 'pizza',
    title: 'The flash sale',
    brief: 'A sale will pop up while you shop. Cover your needs first.',
    passLine: 'You covered every need and skipped the sale. A discount on a want is still spending.',
    failNeeds: 'Cover every essential before any deal.',
    failBought: 'The sale pulled you in. A discount on a want is still money you did not need to spend.'
  },
  {
    id: 'price-rise',
    lessonKeywords: ['budget'],
    situationId: 'sick-day',
    event: 'hike',
    itemId: 'medicine',
    title: 'The price rise',
    brief: 'A price will go up while you shop. Plan around it.',
    passLine: 'The price rose and you still covered every need. Cut a want, never a need.',
    failNeeds: 'When prices go up, cut a want, not a need.'
  }
];

function getMartScenario(id) {
  if (!id) return null;
  return MART_SCENARIOS.find(s => s.id === id) || null;
}

// What the browser may see (it never sees the pass rules).
function getMartScenarios() {
  return MART_SCENARIOS.map(s => ({
    id: s.id,
    title: s.title,
    brief: s.brief,
    lessonKeywords: s.lessonKeywords.slice()
  }));
}

// The one decision, judged on the server.
// info.needsMissed = essentials not in the basket, info.totalNeeds = all essentials.
function judgeMartScenario(id, info) {
  const scenario = getMartScenario(id);
  if (!scenario) return null;
  const bought = new Set((info && info.boughtIds) || []);
  let passed = true;
  let reason = scenario.passLine;
  if (!info || info.needsMissed > 0) {
    passed = false;
    const covered = info && info.totalNeeds ? (info.totalNeeds - info.needsMissed) + ' of ' + info.totalNeeds + ' needs covered. ' : 'Some needs were missed. ';
    reason = covered + scenario.failNeeds;
  } else if (scenario.event === 'sale' && bought.has(scenario.itemId)) {
    passed = false;
    reason = scenario.failBought;
  }
  return { id: scenario.id, title: scenario.title, passed, reason };
}

module.exports = { getMartScenario, getMartScenarios, judgeMartScenario };
