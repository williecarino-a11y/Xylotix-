/*
 * MIIMIID FUN CENTER
 *
 * Server-authoritative Fun Center.
 *
 * The frontend:
 * - loads public game definitions from the API
 * - starts a server-side game session
 * - submits answers to the server
 * - renders server-validated results
 * - never knows the correct answer
 * - never calculates rewards
 */

let miimiidFunCenterGames = [];
let miimiidFunCenterState = null;


/* =========================================================
 * API
 * ========================================================= */

async function miimiidFunCenterRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const message =
      result && typeof result.message === 'string'
        ? result.message
        : `Fun Center request failed: ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = result;
    throw error;
  }

  if (!result || result.status !== 'success') {
    throw new Error(
      result && typeof result.message === 'string'
        ? result.message
        : 'Fun Center response was invalid.'
    );
  }

  return result.data;
}


/* =========================================================
 * LOAD GAME CATALOG
 * ========================================================= */

async function loadMiimiidFunCenter() {
  const content =
    document.getElementById('fun-center-content');

  if (!content) {
    return;
  }

  content.innerHTML = `
    <div class="miimiid-fun-center-loading">
      Loading games…
    </div>
  `;

  try {
    const games =
      await miimiidFunCenterRequest(
        '/api/fun-center/games'
      );

    if (!Array.isArray(games)) {
      throw new Error(
        'Fun Center games response was invalid.'
      );
    }

    miimiidFunCenterGames = games;
    miimiidFunCenterState = null;

    renderMiimiidFunCenter();

  } catch (error) {
    console.error(
      'Miimiid Fun Center loading error:',
      error
    );

    miimiidFunCenterGames = [];
    miimiidFunCenterState = null;

    content.innerHTML = `
      <div class="miimiid-fun-center-error">
        <p>
          Unable to load the Fun Center right now.
        </p>

        <button
          type="button"
          class="miimiid-fun-center-activity"
          data-fun-center-retry
        >
          Try again
        </button>
      </div>
    `;

    const retryButton =
      content.querySelector(
        '[data-fun-center-retry]'
      );

    if (retryButton) {
      retryButton.addEventListener(
        'click',
        () => {
          loadMiimiidFunCenter();
        }
      );
    }
  }
}


/* =========================================================
 * FUN CENTER HOME
 * ========================================================= */

function renderMiimiidFunCenter() {
  const title =
    document.getElementById(
      'fun-center-title'
    );

  const subtitle =
    document.getElementById(
      'fun-center-subtitle'
    );

  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (!title || !subtitle || !content) {
    return;
  }

  title.textContent =
    miimiidDashboardTranslate(
      'funCenter'
    );

  subtitle.textContent =
    miimiidDashboardTranslate(
      'funCenterSubtitle'
    );

  if (
    !Array.isArray(miimiidFunCenterGames) ||
    miimiidFunCenterGames.length === 0
  ) {
    content.innerHTML = `
      <div class="miimiid-fun-center-empty">
        <p>
          No games are available right now.
        </p>
      </div>
    `;

    return;
  }

  content.innerHTML =
    miimiidFunCenterGames
      .map(game => {
        const title =
          typeof game.title === 'string'
            ? game.title
            : 'Fun Center Game';

        const subtitle =
          typeof game.subtitle === 'string'
            ? game.subtitle
            : '';

        return `
          <button
            type="button"
            class="miimiid-fun-center-activity"
            data-fun-center-game="${miimiidFunCenterEscapeHtml(game.id)}"
          >
            <span
              class="miimiid-fun-center-game-title"
            >
              ${miimiidFunCenterEscapeHtml(title)}
            </span>

            ${
              subtitle
                ? `
                  <span
                    class="miimiid-fun-center-game-subtitle"
                  >
                    ${miimiidFunCenterEscapeHtml(subtitle)}
                  </span>
                `
                : ''
            }
          </button>
        `;
      })
      .join('');

  content
    .querySelectorAll(
      '[data-fun-center-game]'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          startMiimiidFunGame(
            button.dataset.funCenterGame
          );
        }
      );
    });
}


/* =========================================================
 * START GAME
 * ========================================================= */

async function startMiimiidFunGame(gameId) {
  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (!content) {
    return;
  }

  const game =
    miimiidFunCenterGames.find(
      item => item.id === gameId
    );

  if (!game) {
    renderMiimiidFunCenter();
    return;
  }

  content.innerHTML = `
    <div class="miimiid-fun-center-loading">
      Starting game…
    </div>
  `;

  try {
    const session =
      await miimiidFunCenterRequest(
        '/api/fun-center/session',
        {
          method: 'POST',
          body: JSON.stringify({
            gameId: game.id
          })
        }
      );

    if (
      !session ||
      typeof session.sessionId !== 'string'
    ) {
      throw new Error(
        'The Fun Center session could not be started.'
      );
    }

    miimiidFunCenterState = {
      gameId: game.id,
      sessionId: session.sessionId,
      roundIndex: 0,
      score: 0,
      correctAnswers: 0,
      roundsCompleted: 0,
      totalRounds:
        Number.isInteger(session.totalRounds)
          ? session.totalRounds
          : Array.isArray(game.rounds)
            ? game.rounds.length
            : 0,
      submitting: false
    };

    renderMiimiidFunGameRound();

  } catch (error) {
    console.error(
      'Miimiid Fun Center start error:',
      error
    );

    content.innerHTML = `
      <div class="miimiid-fun-center-error">
        <p>
          ${miimiidFunCenterEscapeHtml(
            error.message ||
              'Unable to start this game.'
          )}
        </p>

        <button
          type="button"
          class="miimiid-fun-center-activity"
          data-fun-center-back
        >
          Back to games
        </button>
      </div>
    `;

    const backButton =
      content.querySelector(
        '[data-fun-center-back]'
      );

    if (backButton) {
      backButton.addEventListener(
        'click',
        () => {
          miimiidFunCenterState = null;
          renderMiimiidFunCenter();
        }
      );
    }
  }
}


/* =========================================================
 * RENDER ROUND
 * ========================================================= */

function renderMiimiidFunGameRound() {
  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (
    !content ||
    !miimiidFunCenterState
  ) {
    return;
  }

  const game =
    miimiidFunCenterGames.find(
      item =>
        item.id ===
        miimiidFunCenterState.gameId
    );

  if (!game) {
    renderMiimiidFunCenter();
    return;
  }

  const rounds =
    Array.isArray(game.rounds)
      ? game.rounds
      : [];

  const roundIndex =
    miimiidFunCenterState.roundIndex;

  if (roundIndex >= rounds.length) {
    completeMiimiidFunGame();
    return;
  }

  const currentRound =
    rounds[roundIndex];

  const prompt =
    typeof currentRound.prompt === 'string'
      ? currentRound.prompt
      : '';

  const visual =
    typeof currentRound.visual === 'string'
      ? currentRound.visual
      : '';

  const choices =
    Array.isArray(currentRound.choices) &&
    currentRound.choices.length > 0
      ? currentRound.choices
      : Array.isArray(game.answers)
        ? game.answers
        : [];

  const progress =
    roundIndex + 1;

  content.innerHTML = `
    <div
      class="miimiid-fun-center-round"
      data-fun-round="${miimiidFunCenterEscapeHtml(
        currentRound.id || ''
      )}"
    >

      <div
        class="miimiid-fun-center-progress"
      >
        ${progress} / ${rounds.length}
      </div>

      ${
        visual
          ? `
            <div
              class="miimiid-fun-center-visual"
              aria-hidden="true"
            >
              ${miimiidFunCenterEscapeHtml(
                visual
              )}
            </div>
          `
          : ''
      }

      <p
        class="miimiid-fun-center-prompt"
      >
        ${miimiidFunCenterEscapeHtml(
          prompt
        )}
      </p>

      <div
        class="miimiid-fun-center-actions"
      >
        ${choices
          .map(choice => {
            const label =
              typeof choice.label === 'string'
                ? choice.label
                : '';

            return `
              <button
                type="button"
                class="miimiid-fun-center-activity"
                data-fun-answer="${miimiidFunCenterEscapeHtml(
                  choice.id
                )}"
              >
                ${miimiidFunCenterEscapeHtml(
                  label
                )}
              </button>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  content
    .querySelectorAll(
      '[data-fun-answer]'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          submitMiimiidFunAnswer(button);
        }
      );
    });
}


/* =========================================================
 * SUBMIT ANSWER
 * ========================================================= */

async function submitMiimiidFunAnswer(button) {
  if (
    !button ||
    !miimiidFunCenterState ||
    miimiidFunCenterState.submitting
  ) {
    return;
  }

  const state =
    miimiidFunCenterState;

  const answer =
    button.dataset.funAnswer;

  if (!answer) {
    return;
  }

  state.submitting = true;

  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (content) {
    content
      .querySelectorAll(
        '[data-fun-answer]'
      )
      .forEach(answerButton => {
        answerButton.disabled = true;
      });
  }

  try {
    const result =
      await miimiidFunCenterRequest(
        `/api/fun-center/session/${encodeURIComponent(
          state.sessionId
        )}/answer`,
        {
          method: 'POST',
          body: JSON.stringify({
            roundIndex: state.roundIndex,
            answer
          })
        }
      );

    state.score =
      Number.isFinite(result.score)
        ? result.score
        : state.score;

    state.correctAnswers =
      Number.isFinite(result.correctAnswers)
        ? result.correctAnswers
        : state.correctAnswers;

    state.roundsCompleted =
      Number.isFinite(result.roundsCompleted)
        ? result.roundsCompleted
        : state.roundsCompleted;

    state.totalRounds =
      Number.isFinite(result.totalRounds)
        ? result.totalRounds
        : state.totalRounds;

    state.roundIndex++;

    if (result.complete) {
      await completeMiimiidFunGame();
      return;
    }

    state.submitting = false;

    renderMiimiidFunGameRound();

  } catch (error) {
    console.error(
      'Miimiid Fun Center answer error:',
      error
    );

    state.submitting = false;

    if (content) {
      const existingError =
        content.querySelector(
          '[data-fun-answer-error]'
        );

      if (!existingError) {
        const errorElement =
          document.createElement('p');

        errorElement.dataset.funAnswerError =
          '';

        errorElement.className =
          'miimiid-fun-center-error-message';

        errorElement.textContent =
          error.message ||
          'Unable to submit your answer.';

        content
          .querySelector(
            '.miimiid-fun-center-actions'
          )
          ?.prepend(errorElement);
      }

      content
        .querySelectorAll(
          '[data-fun-answer]'
        )
        .forEach(answerButton => {
          answerButton.disabled = false;
        });
    }
  }
}


/* =========================================================
 * COMPLETE GAME
 * ========================================================= */

async function completeMiimiidFunGame() {
  if (!miimiidFunCenterState) {
    return;
  }

  const state =
    miimiidFunCenterState;

  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (content) {
    content.innerHTML = `
      <div class="miimiid-fun-center-loading">
        Finishing game…
      </div>
    `;
  }

  try {
    const result =
      await miimiidFunCenterRequest(
        `/api/fun-center/session/${encodeURIComponent(
          state.sessionId
        )}/complete`,
        {
          method: 'POST'
        }
      );

    renderMiimiidFunGameResult(result);

  } catch (error) {
    console.error(
      'Miimiid Fun Center completion error:',
      error
    );

    if (content) {
      content.innerHTML = `
        <div class="miimiid-fun-center-error">
          <p>
            ${miimiidFunCenterEscapeHtml(
              error.message ||
                'Unable to finish the game.'
            )}
          </p>

          <button
            type="button"
            class="miimiid-fun-center-activity"
            data-fun-center-retry-complete
          >
            Try again
          </button>

          <button
            type="button"
            class="miimiid-fun-center-activity"
            data-fun-center-back
          >
            Back to games
          </button>
        </div>
      `;

      const retryButton =
        content.querySelector(
          '[data-fun-center-retry-complete]'
        );

      if (retryButton) {
        retryButton.addEventListener(
          'click',
          () => {
            completeMiimiidFunGame();
          }
        );
      }

      const backButton =
        content.querySelector(
          '[data-fun-center-back]'
        );

      if (backButton) {
        backButton.addEventListener(
          'click',
          () => {
            miimiidFunCenterState = null;
            renderMiimiidFunCenter();
          }
        );
      }
    }
  }
}


/* =========================================================
 * RESULT
 * ========================================================= */

function renderMiimiidFunGameResult(result) {
  const content =
    document.getElementById(
      'fun-center-content'
    );

  if (
    !content ||
    !miimiidFunCenterState
  ) {
    return;
  }

  const game =
    miimiidFunCenterGames.find(
      item =>
        item.id ===
        miimiidFunCenterState.gameId
    );

  if (!game) {
    renderMiimiidFunCenter();
    return;
  }

  const title =
    typeof game.resultTitle === 'string'
      ? game.resultTitle
      : 'Round complete';

  const message =
    typeof game.resultMessage === 'string'
      ? game.resultMessage
      : '';

  const score =
    Number.isFinite(result.score)
      ? result.score
      : miimiidFunCenterState.score;

  const correctAnswers =
    Number.isFinite(result.correctAnswers)
      ? result.correctAnswers
      : miimiidFunCenterState.correctAnswers;

  const totalRounds =
    Number.isFinite(result.totalRounds)
      ? result.totalRounds
      : miimiidFunCenterState.totalRounds;

  const xp =
    Number.isFinite(result.xp)
      ? result.xp
      : 0;

  const coins =
    Number.isFinite(result.coins)
      ? result.coins
      : 0;

  content.innerHTML = `
    <div
      class="miimiid-fun-center-result"
    >
      <h2>
        ${miimiidFunCenterEscapeHtml(title)}
      </h2>

      ${
        message
          ? `
            <p>
              ${miimiidFunCenterEscapeHtml(
                message
              )}
            </p>
          `
          : ''
      }

      <strong>
        ${correctAnswers} / ${totalRounds}
      </strong>

      <div
        class="miimiid-fun-center-rewards"
      >
        <span>
          +${xp} XP
        </span>

        <span>
          +${coins} Coins
        </span>
      </div>

      <button
        type="button"
        class="miimiid-fun-center-activity"
        data-fun-center-play-again
      >
        Play again
      </button>

      <button
        type="button"
        class="miimiid-fun-center-activity"
        data-fun-center-back
      >
        Back to games
      </button>
    </div>
  `;

  const playAgainButton =
    content.querySelector(
      '[data-fun-center-play-again]'
    );

  if (playAgainButton) {
    playAgainButton.addEventListener(
      'click',
      () => {
        startMiimiidFunGame(game.id);
      }
    );
  }

  const backButton =
    content.querySelector(
      '[data-fun-center-back]'
    );

  if (backButton) {
    backButton.addEventListener(
      'click',
      () => {
        miimiidFunCenterState = null;
        renderMiimiidFunCenter();
      }
    );
  }

  miimiidFunCenterState.score = score;
  miimiidFunCenterState.correctAnswers =
    correctAnswers;
  miimiidFunCenterState.roundsCompleted =
    totalRounds;
}


/* =========================================================
 * HTML ESCAPING
 * ========================================================= */

function miimiidFunCenterEscapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
              }
