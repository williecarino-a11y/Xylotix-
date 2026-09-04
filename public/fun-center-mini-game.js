(function () {
  'use strict';

  const BEST_SCORE_KEY = 'miimiid-money-match-best';
  const ROOT_MARKER = 'data-miimiid-money-match';

  const ROUNDS = [
    {
      question: 'You get ₦5,000 and need ₦2,000 for transport this week. What is the smarter move?',
      choices: ['Spend the full ₦5,000 now', 'Set aside the ₦2,000 and keep the remaining ₦3,000', 'Lend all ₦5,000 to someone'],
      answer: 1,
      feedback: 'Nice. Covering a known need first and keeping the rest gives you a buffer.'
    },
    {
      question: 'You want a new game skin, but buying it would use all your spare money. What is the smarter move?',
      choices: ['Buy it immediately', 'Wait and keep your buffer', 'Borrow money for it'],
      answer: 1,
      feedback: 'Exactly. A want can wait when buying it would wipe out your spare cash.'
    },
    {
      question: 'You receive an unexpected ₦10,000. What is a good first step?',
      choices: ['Spend it all because it was unexpected', 'Set aside part of it before spending', 'Buy the most expensive thing you can find'],
      answer: 1,
      feedback: 'Good call. Saving part first turns unexpected money into a useful opportunity.'
    },
    {
      question: 'A friend wants to borrow money you may need tomorrow. What is the smarter move?',
      choices: ['Give away everything you have', 'Keep enough for your own needs before deciding', 'Borrow more money so you can lend it'],
      answer: 1,
      feedback: 'Right. Helping others should not leave you unable to handle your own essentials.'
    },
    {
      question: 'Something is on sale, but you were not planning to buy it. What should you do?',
      choices: ['Buy it because the price is lower', 'Check whether it fits your plan before buying', 'Buy two because it is a sale'],
      answer: 1,
      feedback: 'Exactly. A discount is only useful when the purchase makes sense for you.'
    }
  ];

  function getBestScore() {
    try {
      const value = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) || '0', 10);
      return Number.isFinite(value) ? value : 0;
    } catch (error) {
      return 0;
    }
  }

  function saveBestScore(score) {
    try {
      if (score > getBestScore()) window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    } catch (error) {
      // Storage is optional. The game still works without it.
    }
  }

  function styles() {
    if (document.querySelector('style[data-miimiid-money-match]')) return;
    const style = document.createElement('style');
    style.dataset.miimiidMoneyMatch = 'true';
    style.textContent = `
      .miimiid-money-match{display:flex;flex-direction:column;gap:14px;width:100%;margin:18px 0;padding:20px;border:1px solid rgba(127,127,127,.22);border-radius:18px;background:var(--miimiid-card-bg,#fff);box-sizing:border-box}
      .miimiid-money-match *{box-sizing:border-box}
      .miimiid-money-match-badge{width:max-content;padding:5px 9px;border-radius:999px;font-size:.75rem;font-weight:700;letter-spacing:.03em;background:rgba(127,127,127,.12)}
      .miimiid-money-match h3{margin:0;font-size:1.25rem}
      .miimiid-money-match p{margin:0;line-height:1.5}
      .miimiid-money-match-meta{display:flex;justify-content:space-between;gap:12px;font-size:.85rem;opacity:.8}
      .miimiid-money-match-progress{height:7px;border-radius:999px;overflow:hidden;background:rgba(127,127,127,.15)}
      .miimiid-money-match-progress span{display:block;height:100%;width:0;border-radius:inherit;background:currentColor;transition:width .2s ease}
      .miimiid-money-match-question{font-weight:700;line-height:1.5}
      .miimiid-money-match-choices{display:grid;gap:9px}
      .miimiid-money-match-choice,.miimiid-money-match-next{width:100%;padding:12px 14px;border:1px solid rgba(127,127,127,.28);border-radius:12px;background:transparent;color:inherit;text-align:left;font:inherit;cursor:pointer}
      .miimiid-money-match-choice:hover,.miimiid-money-match-choice:focus-visible,.miimiid-money-match-next:hover,.miimiid-money-match-next:focus-visible{outline:2px solid currentColor;outline-offset:2px}
      .miimiid-money-match-choice:disabled{cursor:default;opacity:.78}
      .miimiid-money-match-feedback{padding:11px 12px;border-radius:12px;background:rgba(127,127,127,.1);line-height:1.45}
      .miimiid-money-match-next{background:currentColor;color:var(--miimiid-card-bg,#fff);text-align:center;font-weight:700}
      .miimiid-money-match-result{text-align:center;padding:8px 0}
      .miimiid-money-match-result strong{display:block;font-size:1.65rem;margin-bottom:4px}
      @media (max-width:480px){.miimiid-money-match{padding:16px;margin:14px 0}.miimiid-money-match-choice,.miimiid-money-match-next{padding:11px 12px}}
      @media (prefers-reduced-motion:reduce){.miimiid-money-match-progress span{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function createGame() {
    const root = document.createElement('section');
    root.className = 'miimiid-money-match';
    root.setAttribute(ROOT_MARKER, 'true');
    root.setAttribute('aria-labelledby', 'miimiid-money-match-title');

    root.innerHTML = `
      <span class="miimiid-money-match-badge">Mini game</span>
      <div>
        <h3 id="miimiid-money-match-title">Money Match</h3>
        <p>5 quick choices. Pick the smarter money move.</p>
      </div>
      <div class="miimiid-money-match-meta"><span data-mm-round>Round 1 of 5</span><span data-mm-score>Score: 0</span></div>
      <div class="miimiid-money-match-progress" aria-hidden="true"><span data-mm-progress></span></div>
      <div class="miimiid-money-match-question" data-mm-question></div>
      <div class="miimiid-money-match-choices" data-mm-choices role="group" aria-label="Money choices"></div>
      <div class="miimiid-money-match-feedback" data-mm-feedback aria-live="polite" hidden></div>
      <button type="button" class="miimiid-money-match-next" data-mm-next hidden>Next</button>
    `;

    const state = { round: 0, score: 0 };
    const question = root.querySelector('[data-mm-question]');
    const choices = root.querySelector('[data-mm-choices]');
    const feedback = root.querySelector('[data-mm-feedback]');
    const next = root.querySelector('[data-mm-next]');
    const roundLabel = root.querySelector('[data-mm-round]');
    const scoreLabel = root.querySelector('[data-mm-score]');
    const progress = root.querySelector('[data-mm-progress]');

    function renderRound() {
      const item = ROUNDS[state.round];
      roundLabel.textContent = `Round ${state.round + 1} of ${ROUNDS.length}`;
      scoreLabel.textContent = `Score: ${state.score}`;
      progress.style.width = `${((state.round + 1) / ROUNDS.length) * 100}%`;
      question.textContent = item.question;
      choices.innerHTML = '';
      feedback.hidden = true;
      next.hidden = true;

      item.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'miimiid-money-match-choice';
        button.textContent = choice;
        button.addEventListener('click', () => answer(index));
        choices.appendChild(button);
      });
    }

    function answer(index) {
      const item = ROUNDS[state.round];
      const buttons = choices.querySelectorAll('button');
      buttons.forEach((button) => { button.disabled = true; });

      const correct = index === item.answer;
      if (correct) state.score += 1;
      scoreLabel.textContent = `Score: ${state.score}`;
      feedback.textContent = correct ? `Correct! ${item.feedback}` : `Not quite. ${item.feedback}`;
      feedback.hidden = false;
      next.hidden = false;
      next.textContent = state.round === ROUNDS.length - 1 ? 'See result' : 'Next';
    }

    function finish() {
      saveBestScore(state.score);
      const best = getBestScore();
      const message = state.score === ROUNDS.length
        ? 'Perfect round. You spotted all five smarter moves.'
        : state.score >= 3
          ? 'Solid run. You are getting the hang of smart money choices.'
          : 'Good start. Try another round and see if you can beat your score.';

      root.innerHTML = `
        <span class="miimiid-money-match-badge">Mini game complete</span>
        <div class="miimiid-money-match-result">
          <strong>${state.score}/${ROUNDS.length}</strong>
          <p>${message}</p>
          <p>Best score: ${best}/${ROUNDS.length}</p>
        </div>
        <button type="button" class="miimiid-money-match-next" data-mm-restart>Play again</button>
      `;
      root.querySelector('[data-mm-restart]').addEventListener('click', () => {
        state.round = 0;
        state.score = 0;
        root.innerHTML = '';
        root.appendChild(document.createElement('span'));
        // Rebuild the component so all event handlers are fresh.
        const replacement = createGame();
        root.replaceWith(replacement);
      });
    }

    function nextRound() {
      if (state.round === ROUNDS.length - 1) {
        finish();
        return;
      }
      state.round += 1;
      renderRound();
    }

    next.addEventListener('click', nextRound);
    renderRound();
    return root;
  }

  function mount() {
    const host = document.getElementById('fun-center-content');
    if (!host || host.querySelector(`[${ROOT_MARKER}]`)) return;
    host.appendChild(createGame());
  }

  function init() {
    styles();
    mount();
    const observer = new MutationObserver(() => mount());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
