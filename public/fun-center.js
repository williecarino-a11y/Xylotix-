/*
 * MIIMIID FUN CENTER
 *
 * Server-authoritative Fun Center.
 * Frontend loads game definitions, starts sessions, submits answers,
 * and renders server-validated results. Never knows correct answers
 * or calculates rewards itself.
 */

let miimiidFunCenterGames = [];
let miimiidFunCenterState = null;

if (typeof MIIMIID_ASSETS === 'undefined') {
  console.error('Miimiid asset registry failed to load.');
}

const MIIMIID_FUN_COMPLETED_KEY = 'miimiid-fun-completed-games';


/* =========================================================
 * SOUND
 * ========================================================= */

const miimiidFunSoundCtx = { ctx: null };

function miimiidFunGetAudioCtx() {
  if (!miimiidFunSoundCtx.ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    miimiidFunSoundCtx.ctx = new AudioContextClass();
  }
  return miimiidFunSoundCtx.ctx;
}

function miimiidFunTone(freq, duration, type, gainValue) {
  const ctx = miimiidFunGetAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(gainValue || 0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function miimiidFunPlayTap() { miimiidFunTone(520, 0.08, 'sine', 0.05); }
function miimiidFunPlayCorrect() {
  miimiidFunTone(660, 0.12, 'triangle', 0.09);
  setTimeout(() => miimiidFunTone(880, 0.16, 'triangle', 0.09), 90);
}
function miimiidFunPlayWrong() {
  miimiidFunTone(220, 0.18, 'sawtooth', 0.07);
  setTimeout(() => miimiidFunTone(160, 0.22, 'sawtooth', 0.07), 80);
}
function miimiidFunTone(freq, duration, type, gainValue, delay) {
  const ctx = miimiidFunGetAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const start = ctx.currentTime + (delay || 0);
  const peak = gainValue || 0.04;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, start);

  filter.type = 'lowpass';
  filter.frequency.value = 2600;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function miimiidFunBell(freq, duration, gainValue, delay) {
  miimiidFunTone(freq, duration, 'sine', gainValue, delay);
  miimiidFunTone(freq * 2, duration * 0.6, 'sine', (gainValue || 0.04) * 0.25, delay);
}

const MIIMIID_FUN_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

function miimiidFunPlayTap() { miimiidFunTone(660, 0.07, 'sine', 0.02); }

function miimiidFunPlayCorrect(combo) {
  const step = Math.min(Math.max((combo || 1) - 1, 0), MIIMIID_FUN_SCALE.length - 2);
  miimiidFunBell(MIIMIID_FUN_SCALE[step], 0.35, 0.045);
  miimiidFunBell(MIIMIID_FUN_SCALE[step + 1], 0.45, 0.04, 0.09);
}

function miimiidFunPlayWrong() {
  miimiidFunTone(311, 0.28, 'sine', 0.04);
  miimiidFunTone(247, 0.4, 'sine', 0.035, 0.1);
}

function miimiidFunPlayComplete() {
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    miimiidFunBell(freq, 0.7, 0.04, i * 0.13);
  });
}


/* =========================================================
 * MASCOT (hand-drawn with CSS shapes, no image assets)
 * ========================================================= */
const MIIMIID_FUN_POSES = {
  idle: 'thinkingQuestion', correct: 'thumbsUp', wrong: 'sad',
  celebrate: 'happy', wave: 'waving', sleep: 'sleeping',
  run: 'running', confused: 'confused'
};

function miimiidFunMascotAnim(mood) {
  if (mood === 'wrong') return 'none';
  return mood === 'celebrate'
    ? 'miimiidFunMascotCelebrate 0.6s ease-in-out infinite'
    : 'miimiidFunMascotBounce 1.1s ease-in-out infinite';
}

function miimiidFunMascot(mood, size) {
  const dim = size || 56;
  const pose = MIIMIID_FUN_POSES[mood] || 'happy';
  const src = MIIMIID_ASSETS.characters.miimiid[pose];
  return `<img class="miimiid-fun-mascot" data-mood="${mood}" src="${src}" alt="" aria-hidden="true"
    style="width:${dim}px;height:auto;flex-shrink:0;object-fit:contain;animation:${miimiidFunMascotAnim(mood)};"
    onerror="this.outerHTML=miimiidFunMascotCss('${mood}',${dim})">`;
}

function miimiidFunSetMascotMood(el, mood) {
  el.src = MIIMIID_ASSETS.characters.miimiid[MIIMIID_FUN_POSES[mood] || 'happy'];
  el.dataset.mood = mood;
  el.style.animation = miimiidFunMascotAnim(mood);
}

function miimiidFunMascotCss(mood, size) {
  const dimension = size || 56;
  const eyeSize = Math.max(5, Math.round(dimension * 0.14));
  const eyeTop = Math.round(dimension * 0.32);
  const eyeSide = Math.round(dimension * 0.22);
  const mouthTop = Math.round(dimension * 0.55);
  const mouthLeft = Math.round(dimension * 0.32);
  const mouthWidth = Math.round(dimension * 0.36);

  const moods = {
    idle: { body: '#1D9E75', ink: '#04342C', mouth: 'smile', tilt: 0 },
    correct: { body: '#1D9E75', ink: '#04342C', mouth: 'smile', tilt: 0 },
    wrong: { body: '#F0997B', ink: '#4A1B0C', mouth: 'flat', tilt: -4 },
    celebrate: { body: '#7F77DD', ink: '#26215C', mouth: 'smile', tilt: 0 }
  };
  const m = moods[mood] || moods.idle;

  const mouthMarkup = m.mouth === 'smile'
    ? `<div style="position:absolute; top:${mouthTop}px; left:${mouthLeft}px; width:${mouthWidth}px; height:${Math.round(dimension * 0.18)}px; border-bottom:3px solid ${m.ink}; border-radius:0 0 12px 12px;"></div>`
    : `<div style="position:absolute; top:${mouthTop}px; left:${mouthLeft}px; width:${mouthWidth}px; height:2px; background:${m.ink};"></div>`;

  const animation = mood === 'celebrate'
    ? 'miimiidFunMascotCelebrate 0.6s ease-in-out infinite'
    : (mood === 'wrong' ? 'none' : 'miimiidFunMascotBounce 1.1s ease-in-out infinite');

  return `
    <div class="miimiid-fun-mascot" style="width:${dimension}px; height:${dimension}px; border-radius:50%; background:${m.body}; position:relative; flex-shrink:0; transform:rotate(${m.tilt}deg); animation:${animation};">
      <div style="position:absolute; top:${eyeTop}px; left:${eyeSide}px; width:${eyeSize}px; height:${eyeSize}px; border-radius:50%; background:${m.ink};"></div>
      <div style="position:absolute; top:${eyeTop}px; right:${eyeSide}px; width:${eyeSize}px; height:${eyeSize}px; border-radius:50%; background:${m.ink};"></div>
      ${mouthMarkup}
    </div>
  `;
}


/* =========================================================
 * LOCAL COMPLETION TRACKING (purely cosmetic - server owns truth)
 * ========================================================= */

function miimiidFunGetCompletedGames() {
  try {
    const raw = window.localStorage.getItem(MIIMIID_FUN_COMPLETED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function miimiidFunMarkGameCompleted(gameId) {
  try {
    const completed = miimiidFunGetCompletedGames();
    if (!completed.includes(gameId)) {
      completed.push(gameId);
      window.localStorage.setItem(MIIMIID_FUN_COMPLETED_KEY, JSON.stringify(completed));
    }
  } catch { /* best effort only */ }
}


/* =========================================================
 * API
 * ========================================================= */

async function miimiidFunCenterRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });

  let result = null;
  try { result = await response.json(); } catch { result = null; }

  if (!response.ok) {
    const message = result && typeof result.message === 'string' ? result.message : `Fun Center request failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = result;
    throw error;
  }

  if (!result || result.status !== 'success') {
    throw new Error(result && typeof result.message === 'string' ? result.message : 'Fun Center response was invalid.');
  }

  return result.data;
}


/* =========================================================
 * LOAD GAME CATALOG
 * ========================================================= */

async function loadMiimiidFunCenter() {
  const content = document.getElementById('fun-center-content');
  if (!content) return;

  content.innerHTML = `<div class="miimiid-fun-loading">Loading games…</div>`;

  try {
    const games = await miimiidFunCenterRequest('/api/fun-center/games');
    if (!Array.isArray(games)) throw new Error('Fun Center games response was invalid.');

    miimiidFunCenterGames = games;
    miimiidFunCenterState = null;

    renderMiimiidFunCenter();

  } catch (error) {
    console.error('Miimiid Fun Center loading error:', error);
    miimiidFunCenterGames = [];
    miimiidFunCenterState = null;

    content.innerHTML = `
      <div class="miimiid-fun-error">
        <p>Unable to load the Fun Center right now.</p>
        <button type="button" class="miimiid-fun-btn" data-fun-center-retry>Try again</button>
      </div>
    `;

    const retryButton = content.querySelector('[data-fun-center-retry]');
    if (retryButton) retryButton.addEventListener('click', () => loadMiimiidFunCenter());
  }
}


/* =========================================================
 * FUN CENTER HOME - hero card + mascot + level track
 * ========================================================= */

 function renderMiimiidFunCenter() {
  const title = document.getElementById('fun-center-title');
  const subtitle = document.getElementById('fun-center-subtitle');
  const content = document.getElementById('fun-center-content');

  if (!title || !subtitle || !content) return;

  title.textContent = '';
  subtitle.textContent = '';

  if (
    !Array.isArray(miimiidFunCenterGames) ||
    miimiidFunCenterGames.length === 0
  ) {
    content.innerHTML = `
      <div class="miimiid-fun-empty">
        <p>No games are available right now.</p>
      </div>
    `;
    return;
  }

  const completed = miimiidFunGetCompletedGames();

  const heroGame =
    miimiidFunCenterGames.find(
      game => !completed.includes(game.id)
    ) || miimiidFunCenterGames[0];

  const rounds = Array.isArray(heroGame.rounds) ? heroGame.rounds : [];
  const firstRound = rounds.length > 0 ? rounds[0] : null;

  const gameTitle = typeof heroGame.title === 'string' ? heroGame.title : 'Fun Center';
  const gameSubtitle = typeof heroGame.subtitle === 'string' ? heroGame.subtitle : 'Build smarter money habits through play.';
  const visual = firstRound && typeof firstRound.visual === 'string' ? firstRound.visual : '';

  const totalRounds = rounds.length > 0 ? rounds.length : 10;

  const displayedProgress =
    miimiidFunCenterState && miimiidFunCenterState.gameId === heroGame.id
      ? Math.min(miimiidFunCenterState.roundIndex, totalRounds)
      : 0;

  const progressPercent = Math.max(0, Math.min(100, Math.round((displayedProgress / totalRounds) * 100)));

  content.innerHTML = `
    <section class="miimiid-fun-page">

      <div class="miimiid-fun-hero-visual">

        <div class="miimiid-fun-hero-copy">
          <div class="miimiid-fun-title">
            <span>Fun</span>
            <strong>Center</strong>
          </div>
          <p class="miimiid-fun-tagline">
            Play. Learn. Build your<br>financial superpowers!
          </p>
        </div>

        <div class="miimiid-fun-hero-decoration decoration-one">&#10022;</div>
        <div class="miimiid-fun-hero-decoration decoration-two">&#10022;</div>
        <div class="miimiid-fun-hero-decoration decoration-three">&#10022;</div>

        <div class="miimiid-fun-hero-coins">
          <span class="fun-coin coin-one">$</span>
          <span class="fun-coin coin-two">$</span>
        </div>

        <div class="miimiid-fun-hero-mascot">
     <img
     src="${MIIMIID_ASSETS.funCenter.heroRobot}"
      alt=""
      aria-hidden="true"
       onerror="miimiidFunHeroImageError(this)"
        >
          <div class="miimiid-fun-hero-mascot-fallback" hidden>
            ${miimiidFunMascot('idle', 150)}
          </div>
        </div>

      </div>

      <section class="miimiid-fun-game-card">

        <div class="miimiid-fun-progress-header">
          <div class="miimiid-fun-progress-title">
            <span class="miimiid-fun-progress-icon" aria-hidden="true">&#9678;</span>
            <span>YOUR PROGRESS</span>
          </div>
          <span class="miimiid-fun-progress-count">${displayedProgress} / ${totalRounds}</span>
        </div>

        <div class="miimiid-fun-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${totalRounds}" aria-valuenow="${displayedProgress}">
          <div class="miimiid-fun-progress-fill" style="width:${progressPercent}%"></div>
        </div>

        <div class="miimiid-fun-game-divider"></div>

        <div class="miimiid-fun-current-game">

          <div class="miimiid-fun-game-visual">
            ${miimiidFunMascot('idle', 82)}
            ${visual ? `<div class="miimiid-fun-round-icon">${miimiidFunCenterEscapeHtml(visual)}</div>` : ''}
          </div>

          <h2 class="miimiid-fun-current-title">${miimiidFunCenterEscapeHtml(gameTitle)}</h2>
          <p class="miimiid-fun-current-subtitle">${miimiidFunCenterEscapeHtml(gameSubtitle)}</p>

          ${
            firstRound && Array.isArray(firstRound.choices) && firstRound.choices.length > 0
              ? `
                <div class="miimiid-fun-home-choices">
                  ${firstRound.choices.map(choice => {
                    const label = typeof choice.label === 'string' ? choice.label : '';
                    const isWant = /want/i.test(label);
                    return `
                      <button
                        type="button"
                        class="miimiid-fun-home-choice ${isWant ? 'is-want' : 'is-need'}"
                        data-fun-home-answer="${miimiidFunCenterEscapeHtml(choice.id)}"
                        data-fun-home-game="${miimiidFunCenterEscapeHtml(heroGame.id)}"
                      >
                        <span>${miimiidFunCenterEscapeHtml(label)}</span>
                        <span class="miimiid-fun-choice-arrow" aria-hidden="true">&#8594;</span>
                      </button>
                    `;
                  }).join('')}
                </div>
              `
              : `
                <button type="button" class="miimiid-fun-home-play" data-fun-home-play="${miimiidFunCenterEscapeHtml(heroGame.id)}">
                  Play now <span aria-hidden="true">&#8594;</span>
                </button>
              `
          }

        </div>

      </section>

    </section>
  `;

  content.querySelectorAll('[data-fun-home-answer]').forEach(button => {
    button.addEventListener('click', async () => {
      miimiidFunPlayTap();
      button.disabled = true;

      const gameId = button.dataset.funHomeGame;
      const answerId = button.dataset.funHomeAnswer;

      if (!miimiidFunCenterState || miimiidFunCenterState.gameId !== gameId) {
        await startMiimiidFunGame(gameId);
      }

      if (!miimiidFunCenterState || miimiidFunCenterState.gameId !== gameId) {
        return;
      }

      const content = document.getElementById('fun-center-content');
      const roundAnswerButton = content
        ? content.querySelector(`[data-fun-answer="${CSS.escape(answerId)}"]`)
        : null;

      if (roundAnswerButton) {
        await submitMiimiidFunAnswer(roundAnswerButton);
      }
    });
  });

  const playButton = content.querySelector('[data-fun-home-play]');
  if (playButton) {
    playButton.addEventListener('click', () => {
      miimiidFunPlayTap();
      startMiimiidFunGame(playButton.dataset.funHomePlay);
    });
  }
  const shopEntry = document.createElement('button');
  shopEntry.type = 'button';
  const storefront = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.martStorefront;
  shopEntry.className = 'miimiid-shop-entry' + (storefront ? ' has-storefront' : '');
  shopEntry.innerHTML = storefront
    ? `
      <img class="miimiid-shop-entry-photo" src="${storefront}" alt="" onerror="this.parentNode.classList.remove('has-storefront');this.remove()">
      <span class="miimiid-shop-entry-label">
        <strong>Miimiid Mart</strong>
        <span>You have $40. Tap to go shopping &#8594;</span>
      </span>
    `
    : `
      <span aria-hidden="true">🛒</span>
      <span class="miimiid-shop-entry-copy">
        <strong>Miimiid Mart</strong>
        <span>You have $40. Fill your basket wisely.</span>
      </span>
      <span aria-hidden="true">&#8594;</span>
    `;
  const funPage = content.querySelector('.miimiid-fun-page');
  if (funPage) {
    funPage.appendChild(shopEntry);
    shopEntry.addEventListener('click', () => {
      miimiidFunPlayTap();
      startMiimiidShop();
    });
  }
}

function miimiidFunHeroImageError(img) {
  img.style.display = 'none';
  const wrapper = img.closest('.miimiid-fun-hero-mascot');
  const fallback = wrapper ? wrapper.querySelector('.miimiid-fun-hero-mascot-fallback') : null;
  if (fallback) fallback.hidden = false;
  }
  
/* =========================================================
 * START GAME
 * ========================================================= */

async function startMiimiidFunGame(gameId) {
  const content = document.getElementById('fun-center-content');
  if (!content) return;

  const game = miimiidFunCenterGames.find(item => item.id === gameId);
  if (!game) { renderMiimiidFunCenter(); return; }

  content.innerHTML = `<div class="miimiid-fun-loading">Starting game…</div>`;

  try {
    const session = await miimiidFunCenterRequest('/api/fun-center/session', {
      method: 'POST',
      body: JSON.stringify({ gameId: game.id })
    });

    if (!session || typeof session.sessionId !== 'string') {
      throw new Error('The Fun Center session could not be started.');
    }

    miimiidFunCenterState = {
          gameId: game.id,
          sessionId: session.sessionId,
          roundIndex: 0,
          score: 0,
          correctAnswers: 0,
          roundsCompleted: 0,
          combo: 0,
          maxCombo: 0,
          totalRounds: Number.isInteger(session.totalRounds) ? session.totalRounds : (Array.isArray(game.rounds) ? game.rounds.length : 0),
          submitting: false
        };

    renderMiimiidFunGameRound();

  } catch (error) {
    console.error('Miimiid Fun Center start error:', error);

    content.innerHTML = `
      <div class="miimiid-fun-error">
        <p>${miimiidFunCenterEscapeHtml(error.message || 'Unable to start this game.')}</p>
        <button type="button" class="miimiid-fun-btn" data-fun-center-back>Back to games</button>
      </div>
    `;

    const backButton = content.querySelector('[data-fun-center-back]');
    if (backButton) backButton.addEventListener('click', () => { miimiidFunCenterState = null; renderMiimiidFunCenter(); });
  }
}


/* =========================================================
 * RENDER ROUND
 * ========================================================= */

function miimiidFunFormatPrice(value) {
  if (!Number.isFinite(value)) return '';
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

function miimiidFunProductVisual(round, size) {
  const dim = size || 120;
  const emoji = typeof round.visual === 'string' ? round.visual : '';
  const key = typeof round.image === 'string' ? round.image : '';
  const src = key && MIIMIID_ASSETS.products ? MIIMIID_ASSETS.products[key] : '';
  const emojiMarkup = `<span class="miimiid-fun-product-emoji" style="font-size:${Math.round(dim * 0.7)}px;">${miimiidFunCenterEscapeHtml(emoji)}</span>`;
  if (!src) return emojiMarkup;
  return `<img class="miimiid-fun-product-img" src="${src}" alt="" style="width:${dim}px;height:${dim}px;" data-fallback="${miimiidFunCenterEscapeHtml(emojiMarkup)}" onerror="this.outerHTML=this.dataset.fallback">`;
}

function renderMiimiidFunGameRound() {
  const content = document.getElementById('fun-center-content');
  if (!content || !miimiidFunCenterState) return;

  const game = miimiidFunCenterGames.find(item => item.id === miimiidFunCenterState.gameId);
  if (!game) { renderMiimiidFunCenter(); return; }

  const rounds = Array.isArray(game.rounds) ? game.rounds : [];
  const roundIndex = miimiidFunCenterState.roundIndex;

  if (roundIndex >= rounds.length) { completeMiimiidFunGame(); return; }

  const currentRound = rounds[roundIndex];
  const prompt = typeof currentRound.prompt === 'string' ? currentRound.prompt : '';
  const visual = typeof currentRound.visual === 'string' ? currentRound.visual : '';
  const choices = Array.isArray(currentRound.choices) && currentRound.choices.length > 0
    ? currentRound.choices
    : (Array.isArray(game.answers) ? game.answers : []);

  const progress = roundIndex + 1;
  const progressPct = Math.round((progress / rounds.length) * 100);

  content.innerHTML = `
    <div class="miimiid-fun-round-card" data-fun-round="${miimiidFunCenterEscapeHtml(currentRound.id || '')}">
      <div class="miimiid-fun-progress-track">
        <div class="miimiid-fun-progress-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="miimiid-fun-progress-label">${progress} / ${rounds.length}</div>
      <div class="miimiid-fun-hud">
        <span class="miimiid-fun-hud-pill">Score ${miimiidFunCenterState.score}</span>
        <span class="miimiid-fun-hud-pill combo ${miimiidFunCenterState.combo >= 3 ? 'is-hot' : ''}">Combo x${miimiidFunCenterState.combo}</span>
      </div>

      <div class="miimiid-fun-round-mascot-row">
        ${miimiidFunMascot('idle', 48)}
      </div>

      <div class="miimiid-fun-product">
        <div class="miimiid-fun-product-art">${miimiidFunProductVisual(currentRound, 120)}</div>
        ${Number.isFinite(currentRound.price) ? `<div class="miimiid-fun-price">${miimiidFunFormatPrice(currentRound.price)}</div>` : ''}
      </div>
      <p class="miimiid-fun-round-prompt">${miimiidFunCenterEscapeHtml(prompt)}</p>

      <div class="miimiid-fun-choices">
        ${choices.map(choice => {
          const label = typeof choice.label === 'string' ? choice.label : '';
          return `
            <button type="button" class="miimiid-fun-choice" data-fun-answer="${miimiidFunCenterEscapeHtml(choice.id)}">
              ${miimiidFunCenterEscapeHtml(label)}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('[data-fun-answer]').forEach(button => {
    button.addEventListener('click', () => submitMiimiidFunAnswer(button));
  });
}


/* =========================================================
 * SUBMIT ANSWER
 * ========================================================= */
function miimiidFunShowFloat(container, text, isBad) {
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'miimiid-fun-float' + (isBad ? ' is-bad' : '');
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

async function submitMiimiidFunAnswer(button) {
  if (!button || !miimiidFunCenterState || miimiidFunCenterState.submitting) return;

  const state = miimiidFunCenterState;
  const answer = button.dataset.funAnswer;
  if (!answer) return;

  state.submitting = true;

  const content = document.getElementById('fun-center-content');
  const card = content ? content.querySelector('[data-fun-round]') : null;
  const mascotEl = content ? content.querySelector('.miimiid-fun-round-mascot-row .miimiid-fun-mascot') : null;

  if (content) {
    content.querySelectorAll('[data-fun-answer]').forEach(answerButton => { answerButton.disabled = true; });
  }

  try {
    const result = await miimiidFunCenterRequest(
      `/api/fun-center/session/${encodeURIComponent(state.sessionId)}/answer`,
      { method: 'POST', body: JSON.stringify({ roundIndex: state.roundIndex, answer }) }
    );

    const previousCorrect = state.correctAnswers;
    const previousCombo = state.combo || 0;

    state.score = Number.isFinite(result.score) ? result.score : state.score;
    state.correctAnswers = Number.isFinite(result.correctAnswers) ? result.correctAnswers : state.correctAnswers;
    state.roundsCompleted = Number.isFinite(result.roundsCompleted) ? result.roundsCompleted : state.roundsCompleted;
    state.totalRounds = Number.isFinite(result.totalRounds) ? result.totalRounds : state.totalRounds;
    state.combo = Number.isFinite(result.combo) ? result.combo : 0;
    state.maxCombo = Number.isFinite(result.maxCombo) ? result.maxCombo : (state.maxCombo || 0);
    const comboBonus = Number.isFinite(result.comboBonus) ? result.comboBonus : 0;

    const wasCorrect = state.correctAnswers > previousCorrect;

    if (wasCorrect) {
      miimiidFunPlayCorrect(state.combo);
      if (card) card.classList.add('is-correct');
      button.classList.add('is-correct');
      if (mascotEl) miimiidFunSetMascotMood(mascotEl, state.combo >= 3 ? 'celebrate' : 'correct');
      miimiidFunShowFloat(content, comboBonus > 0 ? `+${100 + comboBonus} · Combo x${state.combo}` : '+100');
    } else {
      miimiidFunPlayWrong();
      if (card) card.classList.add('is-wrong');
      button.classList.add('is-wrong');
      if (mascotEl) miimiidFunSetMascotMood(mascotEl, 'wrong');
      if (previousCombo >= 2) miimiidFunShowFloat(content, 'Combo lost', true);
    }

    const explanation = typeof result.explanation === 'string' ? result.explanation : '';
    if (explanation && card) {
      const note = document.createElement('div');
      note.className = 'miimiid-fun-feedback ' + (wasCorrect ? 'is-correct' : 'is-wrong');
      note.textContent = wasCorrect ? explanation : `Not quite. ${explanation}`;
      card.appendChild(note);
    }

    state.roundIndex++;

    setTimeout(async () => {
      if (result.complete) { await completeMiimiidFunGame(); return; }
      state.submitting = false;
      renderMiimiidFunGameRound();
    }, explanation ? 1900 : 550);

  } catch (error) {
    console.error('Miimiid Fun Center answer error:', error);
    state.submitting = false;

    if (content) {
      const existingError = content.querySelector('[data-fun-answer-error]');
      if (!existingError) {
        const errorElement = document.createElement('p');
        errorElement.dataset.funAnswerError = '';
        errorElement.className = 'miimiid-fun-error-message';
        errorElement.textContent = error.message || 'Unable to submit your answer.';
        content.querySelector('.miimiid-fun-choices')?.prepend(errorElement);
      }
      content.querySelectorAll('[data-fun-answer]').forEach(answerButton => { answerButton.disabled = false; });
    }
  }
}


/* =========================================================
 * COMPLETE GAME
 * ========================================================= */

async function completeMiimiidFunGame() {
  if (!miimiidFunCenterState) return;

  const state = miimiidFunCenterState;
  const content = document.getElementById('fun-center-content');

  if (content) content.innerHTML = `<div class="miimiid-fun-loading">Finishing game…</div>`;

  try {
    const result = await miimiidFunCenterRequest(
      `/api/fun-center/session/${encodeURIComponent(state.sessionId)}/complete`,
      { method: 'POST' }
    );

    miimiidFunMarkGameCompleted(state.gameId);
    renderMiimiidFunGameResult(result);

  } catch (error) {
    console.error('Miimiid Fun Center completion error:', error);

    if (content) {
      content.innerHTML = `
        <div class="miimiid-fun-error">
          <p>${miimiidFunCenterEscapeHtml(error.message || 'Unable to finish the game.')}</p>
          <button type="button" class="miimiid-fun-btn" data-fun-center-retry-complete>Try again</button>
          <button type="button" class="miimiid-fun-btn" data-fun-center-back>Back to games</button>
        </div>
      `;

      const retryButton = content.querySelector('[data-fun-center-retry-complete]');
      if (retryButton) retryButton.addEventListener('click', () => completeMiimiidFunGame());

      const backButton = content.querySelector('[data-fun-center-back]');
      if (backButton) backButton.addEventListener('click', () => { miimiidFunCenterState = null; renderMiimiidFunCenter(); });
    }
  }
}


/* =========================================================
 * RESULT
 * ========================================================= */

function renderMiimiidFunGameResult(result) {
  const content = document.getElementById('fun-center-content');
  if (!content || !miimiidFunCenterState) return;

  const game = miimiidFunCenterGames.find(item => item.id === miimiidFunCenterState.gameId);
  if (!game) { renderMiimiidFunCenter(); return; }

  const title = typeof game.resultTitle === 'string' ? game.resultTitle : 'Round complete';
  const correctAnswers = Number.isFinite(result.correctAnswers) ? result.correctAnswers : miimiidFunCenterState.correctAnswers;
  const totalRounds = Number.isFinite(result.totalRounds) ? result.totalRounds : miimiidFunCenterState.totalRounds;
  const ratio = totalRounds > 0 ? correctAnswers / totalRounds : 0;
  const performanceMessage = ratio === 1
    ? 'Perfect round! You know your needs from your wants.'
    : ratio >= 0.6
      ? 'Solid run — you\'re getting the hang of smart money choices.'
      : 'Good start. Try again and sharpen your instincts.';
  const xp = Number.isFinite(result.xp) ? result.xp : 0;
  const coins = Number.isFinite(result.coins) ? result.coins : 0;
  miimiidFunPlayComplete();
  content.innerHTML = `
    <div class="miimiid-fun-hero miimiid-fun-result">
      ${miimiidFunMascot('celebrate', 60)}
      <div class="miimiid-fun-hero-label">${miimiidFunCenterEscapeHtml(title)}</div>
      <div class="miimiid-fun-hero-subtitle">${miimiidFunCenterEscapeHtml(performanceMessage)}</div>
      <div class="miimiid-fun-result-score">${correctAnswers} / ${totalRounds}</div>
      <div class="miimiid-fun-result-combo">Best combo x${miimiidFunCenterState.maxCombo || 0}</div>
      <div class="miimiid-fun-result-rewards">
        <span class="miimiid-fun-pill xp">+${xp} XP</span>
        <span class="miimiid-fun-pill coins">+${coins} coins</span>
      </div>
      <button type="button" class="miimiid-fun-hero-play" data-fun-center-play-again>
        <span aria-hidden="true">&#9654;</span> Play again
      </button>
      <button type="button" class="miimiid-fun-btn-ghost" data-fun-center-back>Back to games</button>
    </div>
  `;
  const playAgainButton = content.querySelector('[data-fun-center-play-again]');
  if (playAgainButton) playAgainButton.addEventListener('click', () => startMiimiidFunGame(game.id));
  const backButton = content.querySelector('[data-fun-center-back]');
  if (backButton) backButton.addEventListener('click', () => { miimiidFunCenterState = null; renderMiimiidFunCenter(); });
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

/* =========================================================
 * WEEKLY SHOP
 * The server owns the budget, prices and need/want answers.
 * ========================================================= */

let miimiidShopState = null;

const MIIMIID_SHOP_OUTCOME_MOOD = {
  'smart-shopper': 'celebrate',
  'almost-there': 'correct',
  'too-many-wants': 'wrong',
  'missing-essentials': 'confused'
};

const MIIMIID_SHOP_OUTCOME_TITLE = {
  'smart-shopper': 'Smart Shopper!',
  'almost-there': 'Almost there!',
  'too-many-wants': 'Wants took over',
  'missing-essentials': 'Essentials missing'
};

function miimiidShopSay(mood, text) {
  const root = document.querySelector('.miimiid-shop');
  if (!root) return;
  const mascot = root.querySelector('.miimiid-shop-miimiid .miimiid-fun-mascot');
  if (mascot && mascot.tagName === 'IMG') miimiidFunSetMascotMood(mascot, mood);
  const bubble = root.querySelector('[data-shop-bubble]');
  if (bubble) bubble.textContent = text;
}

function miimiidShopRefresh() {
  const s = miimiidShopState;
  const root = document.querySelector('.miimiid-shop');
  if (!s || !root) return;

  const remaining = s.budget - s.spent;
  const pct = Math.max(0, Math.min(100, Math.round((remaining / s.budget) * 100)));
  const level = pct <= 20 ? 'low' : pct <= 50 ? 'mid' : 'high';

  const fill = root.querySelector('.miimiid-shop-bar-fill');
  if (fill) { fill.style.width = `${pct}%`; fill.dataset.level = level; }

  const money = root.querySelector('[data-shop-remaining]');
  if (money) money.textContent = `$${remaining}`;

  const checkout = root.querySelector('[data-shop-checkout]');
  if (checkout) {
    checkout.disabled = s.basket.length === 0;
    checkout.textContent = s.basket.length === 0
      ? 'Add items to your basket'
      : `Checkout (${s.basket.length} ${s.basket.length === 1 ? 'item' : 'items'})`;
  }

  root.querySelectorAll('[data-shop-item]').forEach(card => {
    const item = s.shop.items.find(candidate => candidate.id === card.dataset.shopItem);
    if (!item) return;
    const inBasket = s.basket.includes(item.id);
    card.classList.toggle('in-basket', inBasket);
    card.classList.toggle('is-unaffordable', !inBasket && item.price > remaining);
  });
}

async function startMiimiidShop() {
  const content = document.getElementById('fun-center-content');
  if (!content) return;

  content.innerHTML = `<div class="miimiid-fun-loading">Entering the store…</div>`;

  try {
    const shop = await miimiidFunCenterRequest('/api/fun-center/shop');
    const session = await miimiidFunCenterRequest('/api/fun-center/shop/session', {
      method: 'POST',
      body: JSON.stringify({})
    });

    miimiidShopState = {
      shop,
      sessionId: session.sessionId,
      budget: session.budget,
      spent: 0,
      basket: [],
      needStreak: 0,
      busy: false
    };

    renderMiimiidShop();
  } catch (error) {
    console.error('Miimiid shop start error:', error);
    content.innerHTML = `
      <div class="miimiid-fun-error">
        <p>${miimiidFunCenterEscapeHtml(error.message || 'Unable to open the store.')}</p>
        <button type="button" class="miimiid-fun-btn" data-shop-retry>Try again</button>
        <button type="button" class="miimiid-fun-btn" data-shop-back>Back to Fun Center</button>
      </div>
    `;
    const retry = content.querySelector('[data-shop-retry]');
    if (retry) retry.addEventListener('click', () => startMiimiidShop());
    const back = content.querySelector('[data-shop-back]');
    if (back) back.addEventListener('click', () => { miimiidShopState = null; renderMiimiidFunCenter(); });
  }
}

function renderMiimiidShop() {
  const content = document.getElementById('fun-center-content');
  const s = miimiidShopState;
  if (!content || !s) return;

  const interior = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.martInterior;

  content.innerHTML = `
    <div class="miimiid-shop">
      ${interior ? `<div class="miimiid-shop-banner" style="background-image:url('${interior}')"><span>Miimiid Mart</span></div>` : ''}
      <div class="miimiid-shop-top">
        <div class="miimiid-shop-miimiid">
          ${miimiidFunMascot('wave', 64)}
          <div class="miimiid-shop-bubble" data-shop-bubble></div>
        </div>
        <div class="miimiid-shop-budget">
          <div class="miimiid-shop-budget-row">
            <span>Budget left</span>
            <strong data-shop-remaining></strong>
          </div>
          <div class="miimiid-shop-bar"><div class="miimiid-shop-bar-fill" data-level="high"></div></div>
        </div>
      </div>

      <div class="miimiid-shop-grid">
        ${s.shop.items.map(item => `
          <button type="button" class="miimiid-shop-item" data-shop-item="${miimiidFunCenterEscapeHtml(item.id)}">
            <div class="miimiid-shop-item-art">${miimiidFunProductVisual(item, 64)}</div>
            <div class="miimiid-shop-item-name">${miimiidFunCenterEscapeHtml(item.name)}</div>
            <div class="miimiid-shop-item-price">$${item.price}</div>
          </button>
        `).join('')}
      </div>

      <div class="miimiid-shop-basket" data-shop-basket></div>

      <button type="button" class="miimiid-shop-checkout" data-shop-checkout disabled>Add items to your basket</button>
      <button type="button" class="miimiid-fun-btn-ghost" data-shop-leave>Leave the store</button>
    </div>
  `;

  content.querySelectorAll('[data-shop-item]').forEach(card => {
    card.addEventListener('click', () => buyMiimiidShopItem(card.dataset.shopItem, card));
  });

  const checkout = content.querySelector('[data-shop-checkout]');
  if (checkout) checkout.addEventListener('click', () => checkoutMiimiidShop());

  const leave = content.querySelector('[data-shop-leave]');
  if (leave) leave.addEventListener('click', () => { miimiidShopState = null; renderMiimiidFunCenter(); });

  miimiidShopRefresh();
  miimiidShopSay('wave', `You have $${s.budget} for this week's essentials. Tap items to add them to your basket!`);
}

async function buyMiimiidShopItem(itemId, cardEl) {
  const s = miimiidShopState;
  if (!s || s.busy) return;

  const item = s.shop.items.find(candidate => candidate.id === itemId);
  if (!item || s.basket.includes(item.id)) return;

  const remaining = s.budget - s.spent;
  if (item.price > remaining) {
    miimiidFunPlayWrong();
    cardEl.classList.remove('is-shake');
    void cardEl.offsetWidth;
    cardEl.classList.add('is-shake');
    miimiidShopSay('confused', `${item.name} costs $${item.price}, but you only have $${remaining} left.`);
    return;
  }

  s.busy = true;
  const content = document.getElementById('fun-center-content');

  try {
    const result = await miimiidFunCenterRequest(
      `/api/fun-center/shop/session/${encodeURIComponent(s.sessionId)}/buy`,
      { method: 'POST', body: JSON.stringify({ itemId }) }
    );

    s.spent = result.spent;
    s.basket.push(item.id);

    if (result.classification === 'need') {
      s.needStreak++;
      miimiidFunPlayCorrect(s.needStreak);
      miimiidShopSay(s.needStreak >= 3 ? 'celebrate' : 'correct', result.explanation);
      miimiidFunShowFloat(content, `-$${result.price} · Smart pick`);
    } else {
      s.needStreak = 0;
      miimiidFunPlayWrong();
      miimiidShopSay('wrong', `${result.explanation} You have $${result.remaining} left.`);
      miimiidFunShowFloat(content, `-$${result.price}`, true);
    }

    const strip = document.querySelector('[data-shop-basket]');
    if (strip) {
      const chip = document.createElement('span');
      chip.className = 'miimiid-shop-basket-chip';
      chip.innerHTML = miimiidFunProductVisual(item, 28);
      strip.appendChild(chip);
    }

    miimiidShopRefresh();
  } catch (error) {
    console.error('Miimiid shop buy error:', error);
    miimiidShopSay('confused', error.message || 'That did not work. Try again.');
  } finally {
    s.busy = false;
  }
}

async function checkoutMiimiidShop() {
  const s = miimiidShopState;
  if (!s || s.busy || s.basket.length === 0) return;

  s.busy = true;
  const button = document.querySelector('[data-shop-checkout]');
  if (button) { button.disabled = true; button.textContent = 'Checking out…'; }

  try {
    const result = await miimiidFunCenterRequest(
      `/api/fun-center/shop/session/${encodeURIComponent(s.sessionId)}/checkout`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    miimiidShopState = null;
    renderMiimiidShopResult(result);
  } catch (error) {
    console.error('Miimiid shop checkout error:', error);
    s.busy = false;
    miimiidShopRefresh();
    miimiidShopSay('confused', error.message || 'Checkout failed. Try again.');
  }
}

function renderMiimiidShopResult(result) {
  const content = document.getElementById('fun-center-content');
  if (!content) return;

  const mood = MIIMIID_SHOP_OUTCOME_MOOD[result.outcome] || 'correct';
  const title = MIIMIID_SHOP_OUTCOME_TITLE[result.outcome] || 'Shopping complete';
  const needsBought = Array.isArray(result.needsBought) ? result.needsBought.length : 0;
  const missed = Array.isArray(result.needsMissed) ? result.needsMissed : [];
  const xp = Number.isFinite(result.xp) ? result.xp : 0;
  const coins = Number.isFinite(result.coins) ? result.coins : 0;

  miimiidFunPlayComplete();

  content.innerHTML = `
    <div class="miimiid-shop miimiid-shop-result">
      ${miimiidFunMascot(mood, 72)}
      <div class="miimiid-fun-hero-label">${miimiidFunCenterEscapeHtml(title)}</div>
      <div class="miimiid-fun-hero-subtitle">${miimiidFunCenterEscapeHtml(result.message || '')}</div>

      <div class="miimiid-shop-stats">
        <div class="miimiid-shop-stat"><span>Spent</span><strong>$${result.spent}</strong></div>
        <div class="miimiid-shop-stat"><span>Saved</span><strong>$${result.saved}</strong></div>
        <div class="miimiid-shop-stat"><span>On wants</span><strong>$${result.wantsSpent}</strong></div>
      </div>

      <div class="miimiid-fun-result-combo">Needs covered: ${needsBought} / ${result.totalNeeds}</div>

      ${missed.length > 0 ? `
        <div class="miimiid-shop-missed">
          <div class="miimiid-shop-missed-title">Essentials you left behind</div>
          ${missed.map(item => `
            <div class="miimiid-shop-missed-row">
              <div class="miimiid-shop-missed-art">${miimiidFunProductVisual(item, 36)}</div>
              <div class="miimiid-shop-missed-copy">
                <strong>${miimiidFunCenterEscapeHtml(item.name)} · $${item.price}</strong>
                <span>${miimiidFunCenterEscapeHtml(item.explanation || '')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="miimiid-fun-result-rewards">
        <span class="miimiid-fun-pill xp">+${xp} XP</span>
        <span class="miimiid-fun-pill coins">+${coins} coins</span>
      </div>

      <button type="button" class="miimiid-fun-hero-play" data-shop-again><span aria-hidden="true">&#9654;</span> Shop again</button>
      <button type="button" class="miimiid-fun-btn-ghost" data-shop-back>Back to Fun Center</button>
    </div>
  `;

  const again = content.querySelector('[data-shop-again]');
  if (again) again.addEventListener('click', () => startMiimiidShop());
  const back = content.querySelector('[data-shop-back]');
  if (back) back.addEventListener('click', () => renderMiimiidFunCenter());
        }
