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
  run: 'running', confused: 'confused',
  concerned: 'concerned', surprised: 'surprised', encourage: 'encouraging'
};

function miimiidFunMascotAnim(mood) {
  if (mood === 'wrong' || mood === 'concerned') return 'none';
  if (mood === 'surprised') return 'miimiidFunMascotCelebrate 0.5s ease-in-out 2';
  if (mood === 'celebrate') return 'miimiidFunMascotCelebrate 0.6s ease-in-out infinite';
  return 'miimiidFunMascotBounce 1.1s ease-in-out infinite';
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
 * FUN CENTER HOME (Daily Challenge, Miimiid Mart, coming soon)
 * The old Needs vs Wants card game is gone: the Mart already teaches it.
 * ========================================================= */

function miimiidFunHomeStyles() {
  if (document.getElementById('mfh-styles')) return;
  const st = document.createElement('style');
  st.id = 'mfh-styles';
  st.textContent = `
    .mfh { max-width: 460px; margin: 0 auto; padding: 14px 2px 28px; color: #e6e9f0; }
    .mfh button { -webkit-tap-highlight-color: transparent; font-family: inherit; }
    .mfh-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 4px 4px 16px; }
    .mfh-title { font-size: 30px; font-weight: 800; line-height: 1.05; letter-spacing: -.01em; }
    .mfh-title span { color: #e6e9f0; }
    .mfh-title strong { color: #4da3ff; }
    .mfh-tag { margin: 6px 0 0; font-size: 13px; color: #9aa4bd; line-height: 1.35; }
    .mfh-robot { width: 76px; height: 76px; flex-shrink: 0; object-fit: contain; }
    .mfh-robot-fallback { flex-shrink: 0; }
    .mfh-label { margin: 18px 4px 8px; font-size: 11px; font-weight: 800; letter-spacing: .09em; color: #7f8bab; }

    .mfh-daily { display: block; width: 100%; text-align: left; border: 1px solid #232c42; border-radius: 20px; padding: 16px; cursor: pointer; color: inherit;
      background: linear-gradient(160deg, #16213d 0%, #131a2c 70%); position: relative; overflow: hidden; }
    .mfh-daily:active { transform: scale(.99); }
    .mfh-daily-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .mfh-kicker { font-size: 11px; font-weight: 800; letter-spacing: .09em; color: #9ec5ff; }
    .mfh-streak { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 800;
      background: rgba(255, 160, 60, .14); border: 1px solid rgba(255, 160, 60, .5); color: #ffc27a; }
    .mfh-daily h3 { margin: 10px 0 2px; font-size: 20px; line-height: 1.2; color: #fff; }
    .mfh-daily p { margin: 0; font-size: 13px; color: #9aa4bd; line-height: 1.4; }
    .mfh-daily-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; }
    .mfh-cta { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 999px; background: #1f6feb; color: #fff; font-weight: 800; font-size: 14px; }
    .mfh-cta.is-done { background: rgba(31, 111, 235, .16); color: #9ec5ff; border: 1px solid #1f6feb; }
    .mfh-reset { font-size: 12px; color: #7f8bab; }
    .mfh-skel { height: 14px; border-radius: 7px; background: linear-gradient(90deg, #1b2440, #26325a, #1b2440); background-size: 200% 100%; animation: mfhShimmer 1.3s linear infinite; }
    @keyframes mfhShimmer { to { background-position: -200% 0; } }

    .mfh-mart { display: block; position: relative; width: 100%; min-height: 168px; padding: 0; border: 1px solid #232c42; border-radius: 20px; overflow: hidden; cursor: pointer; text-align: left; background: #131a2c; color: inherit; }
    .mfh-mart:active { transform: scale(.99); }
    .mfh-mart img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .mfh-mart::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8, 14, 30, .05) 25%, rgba(8, 14, 30, .88) 100%); }
    .mfh-mart-body { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; padding: 16px; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
    .mfh-mart-body strong { display: block; font-size: 20px; color: #fff; }
    .mfh-mart-body span.mfh-sub { display: block; margin-top: 2px; font-size: 13px; color: #c9d3ea; }
    .mfh-go { width: 38px; height: 38px; border-radius: 50%; background: #1f6feb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .mfh-mart.no-photo { background: linear-gradient(160deg, #1a2b55, #131a2c); }
    .mfh-mart.no-photo .mfh-mart-body { position: relative; min-height: 168px; }

    .mfh-soon { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .mfh-tile { border: 1px dashed #2c3756; border-radius: 16px; padding: 14px; background: rgba(19, 26, 44, .6); }
    .mfh-tile svg { opacity: .7; }
    .mfh-tile b { display: block; margin-top: 8px; font-size: 14px; color: #c9d3ea; }
    .mfh-tile span { display: block; margin-top: 2px; font-size: 11px; font-weight: 800; letter-spacing: .06em; color: #7f8bab; }
    @media (prefers-reduced-motion: reduce) { .mfh-skel { animation: none; } }
  `;
  document.head.appendChild(st);
}

const MIIMIID_FUN_ICONS = {
  flame: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 2.5c.6 3.2-1.4 4.6-2.8 6.4C7.7 10.8 7 12.4 7 14.2A5 5 0 0 0 12 19a5 5 0 0 0 5-4.8c0-2-1-3.4-2-4.6-.2 1.2-.8 2-1.7 2.4.5-2.8-.2-6.2-1.3-9.5z" fill="#ffb347"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5" fill="none" stroke="#9aa4bd" stroke-width="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="#9aa4bd" stroke-width="1.8" stroke-linecap="round"/></svg>'
};

function miimiidFunHomeDailyInner(info) {
  const esc = miimiidFunCenterEscapeHtml;
  if (!info) {
    return `<div class="mfh-daily-top"><span class="mfh-kicker">DAILY CHALLENGE</span></div>
      <h3>A new challenge every day</h3>
      <p>Same shopping trip for everyone. Open it to see today's challenge.</p>
      <div class="mfh-daily-foot"><span class="mfh-cta">Open ${MIIMIID_FUN_ICONS.arrow}</span></div>`;
  }
  const sit = info.situation || {};
  const res = info.result;
  const streak = Number(info.streak) > 0 ? Number(info.streak) : 0;
  const resetAt = info.resetsAt || info.resetAt || info.nextResetAt || null;
  let reset = '';
  if (resetAt) {
    const ms = new Date(resetAt).getTime() - Date.now();
    if (Number.isFinite(ms) && ms > 0) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      reset = `<span class="mfh-reset">New one in ${h}h ${m}m</span>`;
    }
  }
  if (!reset) reset = '<span class="mfh-reset">New one every day</span>';
  let cta;
  if (res) cta = `<span class="mfh-cta is-done">Score ${esc(res.score)}</span>`;
  else if (info.locked) cta = '<span class="mfh-cta is-done">Attempt used</span>';
  else cta = `<span class="mfh-cta">Play now ${MIIMIID_FUN_ICONS.arrow}</span>`;
  return `<div class="mfh-daily-top">
      <span class="mfh-kicker">DAILY CHALLENGE</span>
      ${streak > 0 ? `<span class="mfh-streak">${MIIMIID_FUN_ICONS.flame}${esc(streak)} day streak</span>` : ''}
    </div>
    <h3>${esc(sit.title || 'Today\'s challenge')}</h3>
    <p>${esc(sit.story || 'Same shopping trip for everyone. One official attempt a day.')}</p>
    <div class="mfh-daily-foot">${cta}${reset}</div>`;
}

function renderMiimiidFunCenter() {
  const title = document.getElementById('fun-center-title');
  const subtitle = document.getElementById('fun-center-subtitle');
  const content = document.getElementById('fun-center-content');
  if (!title || !subtitle || !content) return;

  title.textContent = '';
  subtitle.textContent = '';
  miimiidFunHomeStyles();

  const storefront = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.martStorefront;
  const robot = MIIMIID_ASSETS.funCenter && MIIMIID_ASSETS.funCenter.heroRobot;

  content.innerHTML = `
    <section class="mfh">
      <div class="mfh-head">
        <div>
          <div class="mfh-title"><span>Fun</span> <strong>Center</strong></div>
          <p class="mfh-tag">Play. Learn. Build your financial superpowers.</p>
        </div>
        ${robot ? `<img class="mfh-robot" src="${robot}" alt="" aria-hidden="true" onerror="this.style.display='none';this.nextElementSibling.hidden=false">` : ''}
        <div class="mfh-robot-fallback" ${robot ? 'hidden' : ''}>${miimiidFunMascot('idle', 64)}</div>
      </div>

      <div class="mfh-label">TODAY</div>
      <button type="button" class="mfh-daily" data-mfh-daily>
        <div class="mfh-skel" style="width:40%"></div>
        <div class="mfh-skel" style="width:75%;height:20px;margin-top:12px"></div>
        <div class="mfh-skel" style="width:90%;margin-top:10px"></div>
      </button>

      <div class="mfh-label">PLAY</div>
      <button type="button" class="mfh-mart${storefront ? '' : ' no-photo'}" data-mfh-mart>
        ${storefront ? `<img src="${storefront}" alt="" onerror="this.parentNode.classList.add('no-photo');this.remove()">` : ''}
        <span class="mfh-mart-body">
          <span><strong>Miimiid Mart</strong><span class="mfh-sub">You have $40. Shop wisely and survive the week.</span></span>
          <span class="mfh-go">${MIIMIID_FUN_ICONS.arrow}</span>
        </span>
      </button>

      <div class="mfh-label">COMING SOON</div>
      <div class="mfh-soon">
        <div class="mfh-tile">${MIIMIID_FUN_ICONS.lock}<b>Budget Rush</b><span>SOON</span></div>
        <div class="mfh-tile">${MIIMIID_FUN_ICONS.lock}<b>Scam Alert</b><span>SOON</span></div>
      </div>
    </section>
  `;

  const open = () => { miimiidFunPlayTap(); startMiimiidShop(); };
  const daily = content.querySelector('[data-mfh-daily]');
  const mart = content.querySelector('[data-mfh-mart]');
  if (daily) daily.addEventListener('click', open);
  if (mart) mart.addEventListener('click', open);

  // the daily card fills in once the server answers; if it fails the card still opens the challenge
  miimiidFunCenterRequest('/api/fun-center/daily', { headers: { 'X-Continue-Loading': 'false' } })
    .then(info => { if (daily && daily.isConnected) daily.innerHTML = miimiidFunHomeDailyInner(info); })
    .catch(() => { if (daily && daily.isConnected) daily.innerHTML = miimiidFunHomeDailyInner(null); });
}

async function loadMiimiidFunCenter() {
  const content = document.getElementById('fun-center-content');
  if (!content) return;
  miimiidFunCenterGames = [];
  miimiidFunCenterState = null;
  renderMiimiidFunCenter();
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
