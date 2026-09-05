(function () {
  'use strict';

  const GAME_ID = 'money-match';
  const BEST_SCORE_KEY = 'miimiid-money-match-best';
  const ROOT_MARKER = 'data-miimiid-money-match';

  async function loadGameDefinition() {
    try {
      const response = await fetch('/api/fun-center/games', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) return null;
      const payload = await response.json();
      const games = payload && payload.status === 'success' && Array.isArray(payload.data) ? payload.data : [];
      return games.find(game => game && game.id === GAME_ID) || null;
    } catch (error) {
      return null;
    }
  }

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
      // Best score persistence is optional.
    }
  }

  async function startServerSession() {
    try {
      const response = await fetch('/api/fun-center/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ gameId: GAME_ID })
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && payload.status === 'success' ? payload.data : null;
    } catch (error) {
      return null;
    }
  }

  async function submitServerAnswer(sessionId, roundIndex, answer) {
    try {
      const response = await fetch(`/api/fun-center/session/${encodeURIComponent(sessionId)}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ roundIndex, answer })
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && payload.status === 'success' ? payload.data : null;
    } catch (error) {
      return null;
    }
  }

  async function completeServerSession(sessionId) {
    try {
      const response = await fetch(`/api/fun-center/session/${encodeURIComponent(sessionId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: '{}'
      });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && payload.status === 'success' ? payload.data : null;
    } catch (error) {
      return null;
    }
  }

  function createShell() {
    const root = document.createElement('section');
    root.className = 'miimiid-fun-center-card miimiid-money-match';
    root.setAttribute(ROOT_MARKER, 'true');
    root.setAttribute('aria-labelledby', 'miimiid-money-match-title');
    root.innerHTML = `
      <div class="miimiid-money-match-header">
        <span class="miimiid-money-match-badge">Mini game</span>
        <h3 id="miimiid-money-match-title">Money Match</h3>
        <p data-mm-subtitle>Loading game…</p>
      </div>
      <div class="miimiid-money-match-meta" aria-live="polite">
        <span data-mm-round>Loading…</span>
        <span data-mm-score>Score: 0</span>
      </div>
      <div class="miimiid-money-match-progress" role="progressbar" aria-label="Money Match progress" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0">
        <span data-mm-progress></span>
      </div>
      <div class="content-summary miimiid-money-match-question" data-mm-question></div>
      <div class="miimiid-money-match-choices" data-mm-choices role="group" aria-label="Money choices"></div>
      <div class="content-callout miimiid-money-match-feedback" data-mm-feedback aria-live="polite" hidden></div>
      <button type="button" class="btn miimiid-money-match-next" data-mm-next hidden>Next</button>
    `;
    return root;
  }

  async function hydrateGame(root, game) {
    if (!game || !Array.isArray(game.rounds) || game.rounds.length === 0) {
      root.innerHTML = `
        <div class="content-callout miimiid-money-match-feedback" role="alert">
          Money Match is temporarily unavailable. Please try again shortly.
        </div>
      `;
      return;
    }

    const rounds = game.rounds;
    const state = {
      round: 0,
      score: 0,
      sessionId: null,
      serverReady: false,
      busy: false,
      sessionPromise: startServerSession()
    };

    const title = root.querySelector('#miimiid-money-match-title');
    const subtitle = root.querySelector('[data-mm-subtitle]');
    const question = root.querySelector('[data-mm-question]');
    const choices = root.querySelector('[data-mm-choices]');
    const feedback = root.querySelector('[data-mm-feedback]');
    const next = root.querySelector('[data-mm-next]');
    const roundLabel = root.querySelector('[data-mm-round]');
    const scoreLabel = root.querySelector('[data-mm-score]');
    const progress = root.querySelector('[data-mm-progress]');

    title.textContent = game.title || 'Money Match';
    subtitle.textContent = game.subtitle || '';

    state.sessionPromise.then((session) => {
      if (!session || !session.sessionId) return;
      state.sessionId = session.sessionId;
      state.serverReady = true;
    });

    function setChoicesDisabled(disabled) {
      choices.querySelectorAll('button').forEach((button) => { button.disabled = disabled; });
    }

    function renderRound() {
      const item = rounds[state.round];
      roundLabel.textContent = `Round ${state.round + 1} of ${rounds.length}`;
      scoreLabel.textContent = `Score: ${state.score}/${rounds.length}`;
      progress.style.width = `${((state.round + 1) / rounds.length) * 100}%`;
      progress.setAttribute('aria-valuemax', String(rounds.length));
      progress.setAttribute('aria-valuenow', String(state.round + 1));
      question.textContent = item.prompt || '';
      choices.innerHTML = '';
      feedback.hidden = true;
      next.hidden = true;
      next.disabled = false;
      state.busy = false;

      const availableChoices = Array.isArray(item.choices) ? item.choices : [];
      availableChoices.forEach((choice) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option miimiid-money-match-choice';
        button.textContent = choice.label || choice.id;
        button.addEventListener('click', () => answer(choice.id));
        choices.appendChild(button);
      });
    }

    async function answer(answerId) {
      if (state.busy) return;
      state.busy = true;
      setChoicesDisabled(true);

      const session = state.sessionPromise ? await state.sessionPromise : null;
      if (session && session.sessionId) {
        state.sessionId = session.sessionId;
        state.serverReady = true;
      }

      if (!state.serverReady) {
        feedback.textContent = 'We could not start your game session. Please try again.';
        feedback.hidden = false;
        state.busy = false;
        setChoicesDisabled(false);
        return;
      }

      const serverResult = await submitServerAnswer(state.sessionId, state.round, answerId);
      if (!serverResult) {
        feedback.textContent = 'Your answer could not be recorded. Please try again.';
        feedback.hidden = false;
        state.busy = false;
        setChoicesDisabled(false);
        return;
      }

      const correct = Boolean(serverResult.correct);
      state.score = Number.isInteger(serverResult.correctAnswers)
        ? serverResult.correctAnswers
        : state.score + (correct ? 1 : 0);

      scoreLabel.textContent = `Score: ${state.score}/${rounds.length}`;
      const explanation = rounds[state.round].feedback || '';
      feedback.textContent = correct ? `Correct! ${explanation}` : `Not quite. ${explanation}`;
      feedback.hidden = false;
      next.hidden = false;
      next.textContent = state.round === rounds.length - 1 ? 'See result' : 'Next';
    }

    async function finish() {
      next.disabled = true;
      const completion = await completeServerSession(state.sessionId);
      if (!completion) {
        next.disabled = false;
        return;
      }

      saveBestScore(state.score);
      const best = getBestScore();
      const points = Number.isFinite(completion.score) ? completion.score : state.score * 100;
      const rewardText = Number.isFinite(completion.xp) && Number.isFinite(completion.coins)
        ? `<p>Reward: ${completion.xp} XP · ${completion.coins} coins</p>`
        : '';
      const message = state.score === rounds.length
        ? 'Perfect round. You spotted all five smarter moves.'
        : state.score >= Math.ceil(rounds.length * 0.6)
          ? 'Solid run. You are getting the hang of smart money choices.'
          : 'Good start. Try another round and see if you can beat your score.';

      root.innerHTML = `
        <div class="content-summary miimiid-money-match-result" aria-live="polite">
          <span class="miimiid-money-match-badge">${game.resultTitle || 'Mini game complete'}</span>
          <h3>${game.title || 'Money Match'}</h3>
          <strong>${state.score}/${rounds.length}</strong>
          <p>${message}</p>
          <p>${game.resultMessage || ''}</p>
          <p>Score: ${points} points</p>
          <p>Best: ${best}/${rounds.length}</p>
          ${rewardText}
        </div>
        <button type="button" class="btn miimiid-money-match-next" data-mm-restart>Play again</button>
      `;
      root.querySelector('[data-mm-restart]').addEventListener('click', () => {
        const replacement = createShell();
        root.replaceWith(replacement);
        loadGameDefinition().then((definition) => hydrateGame(replacement, definition));
      });
    }

    next.addEventListener('click', async () => {
      if (!state.busy) return;
      if (state.round === rounds.length - 1) await finish();
      else {
        state.round += 1;
        renderRound();
      }
    });

    renderRound();
  }

  async function createGame() {
    const root = createShell();
    const game = await loadGameDefinition();
    await hydrateGame(root, game);
    return root;
  }

  function mount() {
    const host = document.getElementById('fun-center-content');
    if (!host || host.querySelector(`[${ROOT_MARKER}]`)) return;

    const placeholder = createShell();
    host.appendChild(placeholder);
    loadGameDefinition().then((game) => hydrateGame(placeholder, game));
  }

  function init() {
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
