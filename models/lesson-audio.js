/*
 * MIIMIID LESSON AUDIO
 *
 * A "Listen" control above the lesson text. It reads the lesson title and
 * content blocks out loud with the phone's built-in voice (no server, no cost),
 * highlights the block being read, and lets the learner pause, stop and
 * change the speed.
 *
 * Loaded after learn-journey.js and mart-scenario.js in index.html.
 */
(function () {
  'use strict';
  if (window.MiimiidLessonAudio) return;

  var synth = window.speechSynthesis;
  if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return; // browser has no speech

  var SPEEDS = [0.9, 1, 1.15, 1.3];
  var SPEED_KEY = 'miimiid-audio-speed';

  var state = { mode: 'idle', items: [], idx: 0, speedIdx: 1 }; // mode: idle | playing | paused
  var runToken = 0;
  var markedEl = null;
  var ui = null;

  function $(id) { return document.getElementById(id); }

  function t(key, fallback) {
    try {
      var v = window.miimiidTranslate(key, getSavedLanguage());
      if (typeof v === 'string' && v && v !== key) return v;
    } catch (e) { /* ignore */ }
    return fallback;
  }

  try {
    var savedSpeed = parseInt(window.localStorage.getItem(SPEED_KEY), 10);
    if (savedSpeed >= 0 && savedSpeed < SPEEDS.length) state.speedIdx = savedSpeed;
  } catch (e) { /* ignore */ }

  /* ---------- text ---------- */

  function cleanLine(s) {
    return String(s == null ? '' : s)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '') // emoji are not read aloud
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Lines such as headings get a full stop so the voice pauses after them.
  function blockText(node) {
    var raw = String(node.innerText || node.textContent || '');
    return raw.split(/\n+/).map(cleanLine).filter(Boolean).map(function (line) {
      return /[.!?:;]$/.test(line) ? line : line + '.';
    }).join(' ');
  }

  // Short pieces read more reliably on phones than one long utterance.
  function splitSentences(text) {
    var parts = text.match(/[^.!?]+(?:[.!?]+|$)\s*/g) || [text];
    var out = [];
    var cur = '';
    parts.forEach(function (p) {
      if (cur && (cur + p).length > 220) { out.push(cur.trim()); cur = p; } else { cur += p; }
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function buildItems() {
    var items = [];
    var title = $('lesson-title');
    var titleText = title ? blockText(title) : '';
    if (titleText) splitSentences(titleText).forEach(function (c) { items.push({ text: c, el: null }); });
    var box = $('lesson-content');
    if (box) {
      Array.prototype.forEach.call(box.children, function (block) {
        var txt = blockText(block);
        if (!txt) return;
        splitSentences(txt).forEach(function (c) { items.push({ text: c, el: block }); });
      });
    }
    return items;
  }

  /* ---------- voice ---------- */

  function pickVoice() {
    var voices = [];
    try { voices = synth.getVoices() || []; } catch (e) { /* ignore */ }
    var en = voices.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || ''); });
    if (!en.length) return null;
    var nice = en.filter(function (v) { return /google|natural|neural/i.test(v.name || ''); });
    return (nice.length ? nice : en)[0];
  }

  /* ---------- highlight ---------- */

  function mark(el) {
    if (markedEl === el) return;
    if (markedEl) markedEl.classList.remove('lja-now');
    markedEl = el;
    if (el) {
      el.classList.add('lja-now');
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { /* ignore */ }
    }
  }

  /* ---------- playback ---------- */

  function speakFrom(i) {
    if (state.mode !== 'playing') return;
    if (i >= state.items.length) { stop(); return; }
    state.idx = i;
    var item = state.items[i];
    mark(item.el);

    var u = new window.SpeechSynthesisUtterance(item.text);
    var voice = pickVoice();
    if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
    u.rate = SPEEDS[state.speedIdx];

    var token = runToken;
    u.onend = function () { if (token === runToken) speakFrom(i + 1); };
    u.onerror = function (e) {
      if (token !== runToken) return;
      if (e && (e.error === 'interrupted' || e.error === 'canceled')) return;
      stop();
    };
    synth.speak(u);
  }

  function startAt(i) {
    runToken++;
    var token = runToken;
    try { synth.cancel(); } catch (e) { /* ignore */ }
    // A short gap after cancel() keeps some Android browsers from dropping the next phrase.
    setTimeout(function () {
      if (token !== runToken) return;
      speakFrom(i);
    }, 60);
  }

  function play() {
    state.items = buildItems();
    if (!state.items.length) return;
    state.mode = 'playing';
    state.idx = 0;
    render();
    startAt(0);
  }

  function pause() {
    if (state.mode !== 'playing') return;
    state.mode = 'paused';
    runToken++;
    try { synth.cancel(); } catch (e) { /* ignore */ }
    render();
  }

  function resume() {
    if (state.mode !== 'paused') return;
    state.mode = 'playing';
    render();
    startAt(state.idx); // starts again from the start of the current phrase
  }

  function stop() {
    runToken++;
    try { synth.cancel(); } catch (e) { /* ignore */ }
    state.mode = 'idle';
    state.idx = 0;
    mark(null);
    render();
  }

  function cycleSpeed() {
    state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
    try { window.localStorage.setItem(SPEED_KEY, String(state.speedIdx)); } catch (e) { /* ignore */ }
    render();
    if (state.mode === 'playing') startAt(state.idx);
  }

  /* ---------- controls ---------- */

  function injectStyles() {
    if ($('lesson-audio-styles')) return;
    var style = document.createElement('style');
    style.id = 'lesson-audio-styles';
    style.textContent =
      '.lja{display:flex;gap:8px;align-items:center;margin:4px 0 14px}' +
      '.lja button{font:inherit;font-weight:600;font-size:.92rem;border-radius:12px;padding:10px 14px;cursor:pointer;border:1px solid #334155;background:#1e293b;color:#f8fafc}' +
      '.lja .lja-main{flex:1;text-align:left;background:#0f2a44;border-color:#1d4ed8}' +
      '.lja .lja-main.is-on{background:#1d4ed8;border-color:#1d4ed8}' +
      '.lja .lja-stop{min-width:44px;padding:10px 0;text-align:center}' +
      '.lja .lja-speed{min-width:58px;text-align:center}' +
      '.lja-now{box-shadow:inset 3px 0 0 #38bdf8;background:rgba(56,189,248,.08);border-radius:8px;transition:background .2s}';
    document.head.appendChild(style);
  }

  function render() {
    if (!ui) return;
    var main = ui.querySelector('.lja-main');
    var stopBtn = ui.querySelector('.lja-stop');
    var speedBtn = ui.querySelector('.lja-speed');
    if (state.mode === 'playing') {
      main.textContent = '\u275A\u275A  ' + t('audioPause', 'Pause');
      main.classList.add('is-on');
    } else if (state.mode === 'paused') {
      main.textContent = '\u25B6  ' + t('audioResume', 'Resume');
      main.classList.add('is-on');
    } else {
      main.textContent = '\u25B6  ' + t('audioListen', 'Listen');
      main.classList.remove('is-on');
    }
    stopBtn.hidden = state.mode === 'idle';
    stopBtn.setAttribute('aria-label', t('audioStop', 'Stop'));
    speedBtn.textContent = SPEEDS[state.speedIdx] + '\u00D7';
  }

  function inject() {
    injectStyles();
    var old = $('lj-audio');
    if (old) old.remove();
    var content = $('lesson-content');
    if (!content || !content.parentNode) return;

    ui = document.createElement('div');
    ui.id = 'lj-audio';
    ui.className = 'lja';
    ui.innerHTML =
      '<button type="button" class="lja-main"></button>' +
      '<button type="button" class="lja-stop" hidden>\u25A0</button>' +
      '<button type="button" class="lja-speed"></button>';
    ui.querySelector('.lja-main').addEventListener('click', function () {
      if (state.mode === 'playing') pause();
      else if (state.mode === 'paused') resume();
      else play();
    });
    ui.querySelector('.lja-stop').addEventListener('click', stop);
    ui.querySelector('.lja-speed').addEventListener('click', cycleSpeed);
    content.parentNode.insertBefore(ui, content);
    render();
  }

  /* ---------- hooks ---------- */

  var previousOpenLesson = window.openLesson;
  if (typeof previousOpenLesson === 'function') {
    window.openLesson = function () {
      stop();
      var result = previousOpenLesson.apply(this, arguments);
      try { inject(); } catch (e) { console.error(e); }
      return result;
    };
  }

  // Stop reading when the lesson text leaves the screen (quiz, other tab, back to the course list).
  setInterval(function () {
    var content = $('lesson-content');
    var visible = !!(content && content.offsetParent !== null);
    if (ui) ui.style.display = visible ? '' : 'none';
    if (!visible && state.mode !== 'idle') stop();
  }, 600);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state.mode === 'playing') pause();
  });
  window.addEventListener('pagehide', function () {
    try { synth.cancel(); } catch (e) { /* ignore */ }
  });

  window.MiimiidLessonAudio = { play: play, pause: pause, resume: resume, stop: stop };
})();
