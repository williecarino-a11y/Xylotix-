/*
 * MIIMIID MART FEEL
 * 1. In-store goal tracker (level trips): a small "Goals" tab under the top meters. It opens by itself for a few seconds
 *    after the level intro, then folds away. Tap it any time to see the star goals.
 * 2. Sound: short, quiet synth cues for pickup, scan, flash sale, money/time running low, a heartbeat in the last moments,
 *    level intro, trip result (clear / not cleared / paid). Respects the Mart sound setting and stays silent when the app is hidden.
 * 3. Touch: matching short vibrations on phones that support it.
 * Visual/audio only: it never changes prices, items, scores or rules. If anything fails, the store plays as before.
 *
 * Set window.MiimiidMartFeel.sounds = false (or .haptics = false) to switch a part off.
 */
(function () {
  'use strict';

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" fill="currentColor"/></svg>';

  function css() {
    if (document.getElementById('mart-feel-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-feel-css';
    st.textContent =
      '.mf-goals { position: absolute; right: 10px; top: 64px; z-index: 7; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; pointer-events: none; opacity: 0; transform: translateY(-6px); transition: opacity .4s ease, transform .4s ease; }' +
      '.mf-goals.show { opacity: 1; transform: none; }' +
      '.mf-pill { pointer-events: auto; display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--acc, #8cc4ff); color: #eef3ff; border-radius: 999px; padding: 6px 11px 6px 9px;' +
      '  font: 800 11px/1 inherit; letter-spacing: .12em; background: rgba(8,13,30,.72); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 6px 18px rgba(0,0,0,.4); cursor: pointer; }' +
      '.mf-pill svg { width: 13px; height: 13px; color: #ffd34d; }' +
      '.mf-panel { pointer-events: auto; width: 230px; max-width: 70vw; border: 1px solid var(--acc, #8cc4ff); border-radius: 16px; padding: 10px 12px; background: rgba(8,13,30,.82);' +
      '  -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); box-shadow: 0 12px 30px rgba(0,0,0,.5); transform-origin: top right; transition: opacity .25s ease, transform .25s ease; }' +
      '.mf-goals:not(.open) .mf-panel { opacity: 0; transform: scale(.92); pointer-events: none; height: 0; padding-top: 0; padding-bottom: 0; border-width: 0; overflow: hidden; }' +
      '.mf-panel h5 { margin: 0 0 6px; font-size: 10px; letter-spacing: .16em; color: var(--acc, #8cc4ff); font-weight: 800; }' +
      '.mf-row { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; font-size: 12.5px; line-height: 1.35; color: #e6e9f0; }' +
      '.mf-row svg { flex: none; width: 13px; height: 13px; margin-top: 2px; color: #ffd34d; }' +
      '@media (prefers-reduced-motion: reduce) { .mf-goals { transition: none; } }';
    document.head.appendChild(st);
  }

  // ---------- sound ----------
  var actx = null;
  var API = { sounds: true, haptics: true };

  function soundOff() {
    try { return !!(window.MiimiidMart && window.MiimiidMart.settings && window.MiimiidMart.settings.soundOff()); } catch (e) { return false; }
  }
  function ctx() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!actx) actx = new AC();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function canPlay() { return API.sounds && !document.hidden && !soundOff(); }

  function tone(f, at, dur, type, vol, f2) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + at;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function whoosh(at) {
    var a = ctx(); if (!a) return;
    var len = Math.floor(a.sampleRate * 0.7), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = a.createBufferSource(); src.buffer = buf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4;
    var t0 = a.currentTime + at;
    bp.frequency.setValueAtTime(260, t0); bp.frequency.exponentialRampToValueAtTime(2600, t0 + 0.6);
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.68);
    src.connect(bp); bp.connect(g); g.connect(a.destination);
    src.start(t0);
  }

  var CUE = {
    pop: function () { tone(880, 0, 0.09, 'sine', 0.07, 1180); },
    scan: function () { tone(1250, 0, 0.06, 'triangle', 0.05); tone(1750, 0.07, 0.08, 'triangle', 0.05); },
    sale: function () { tone(740, 0, 0.12, 'square', 0.03); tone(988, 0.15, 0.16, 'square', 0.03); },
    low: function () { tone(220, 0, 0.22, 'sine', 0.08, 150); },
    beat: function () { tone(95, 0, 0.14, 'sine', 0.12, 60); tone(80, 0.17, 0.16, 'sine', 0.09, 52); },
    intro: function () { whoosh(0.35); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.28, 'triangle', 0.08); }); tone(1568, 0.4, 0.4, 'sine', 0.05); },
    fail: function () { tone(392, 0, 0.22, 'sine', 0.07, 370); tone(311, 0.22, 0.36, 'sine', 0.07, 280); },
    paid: function () { tone(1318, 0, 0.1, 'triangle', 0.07); tone(1760, 0.09, 0.3, 'triangle', 0.07); }
  };
  function cue(name) {
    try { if (canPlay() && CUE[name]) CUE[name](); } catch (e) {}
  }

  // ---------- touch ----------
  function haptic(p) {
    try {
      if (!API.haptics || document.hidden || !navigator.vibrate) return;
      var s = window.MiimiidMart && window.MiimiidMart.settings;
      if (s && typeof s.hapticsOff === 'function' && s.hapticsOff()) return;
      navigator.vibrate(p);
    } catch (e) {}
  }

  function num(s) { var m = /(-?\d+)/.exec(s || ''); return m ? parseInt(m[1], 10) : NaN; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // ---------- goal tracker ----------
  function buildGoals(holder, lv, timers, isDone) {
    if (!lv || !lv.goals || !lv.goals.length) return null;
    var box = document.createElement('div');
    box.className = 'mf-goals';
    var acc = window.MiimiidMartThemes && window.MiimiidMartThemes.accent(lv.n);
    if (acc) box.style.setProperty('--acc', acc);
    box.innerHTML =
      '<button type="button" class="mf-pill">' + STAR + 'GOALS</button>' +
      '<div class="mf-panel"><h5>EARN STARS</h5>' +
      lv.goals.map(function (g) { return '<div class="mf-row">' + STAR + '<span>' + esc(g) + '</span></div>'; }).join('') + '</div>';
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click'].forEach(function (ev) {
      box.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
    var closeT = 0;
    function open(v) { box.classList.toggle('open', v); clearTimeout(closeT); }
    box.querySelector('.mf-pill').addEventListener('click', function () {
      var v = !box.classList.contains('open');
      open(v);
      if (v) { closeT = setTimeout(function () { open(false); }, 6000); timers.push(closeT); }
    });
    holder.appendChild(box);
    // appears after the level intro, opens for a few seconds so players discover it, then folds away
    timers.push(setTimeout(function () { if (!isDone()) box.classList.add('show'); }, 3300));
    timers.push(setTimeout(function () { if (!isDone()) open(true); }, 3600));
    timers.push(setTimeout(function () { if (!isDone()) open(false); }, 8200));
    return box;
  }

  // ---------- one trip ----------
  function begin(scene) {
    var holder = document.querySelector('.mw-holder');
    if (!holder || holder.querySelector('.mf-goals') || holder._mfOn) return;
    css();
    holder._mfOn = true;
    var lv = window.MiimiidMart && window.MiimiidMart.levels && window.MiimiidMart.levels.current;
    var timers = [], done = false;
    function isDone() { return done; }

    var box = buildGoals(holder, lv, timers, isDone);
    if (lv) timers.push(setTimeout(function () { cue('intro'); }, 150));

    var clockEl = document.querySelector('[data-mw-clock]');
    var walletEl = document.querySelector('[data-mw-wallet]');
    var countEl = document.querySelector('[data-mw-count]');
    var lastCount = countEl ? num(countEl.textContent) : 0;
    if (!isFinite(lastCount)) lastCount = 0;
    var wasSale = false, wasTight = false, wasResult = false, lastBeat = 0;

    function onClick(e) {
      try {
        var b = e.target && e.target.closest ? e.target.closest('button') : null;
        if (!b || !holder.contains(b)) return;
        var label = (b.textContent || '').trim();
        if (/scan/i.test(label)) { cue('scan'); haptic(8); }
        else if (b.classList.contains('mw-grab') || /grab/i.test(label)) { haptic(6); }
      } catch (err) {}
    }
    document.addEventListener('click', onClick, true);

    function stop() {
      if (done) return; done = true;
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      document.removeEventListener('click', onClick, true);
      holder._mfOn = false;
    }

    timers.push(setInterval(function () {
      try {
        if (!document.body.contains(holder)) { stop(); return; }

        var resultEl = document.querySelector('.mw-overlay');
        var resultOpen = !!resultEl;
        if (resultOpen && !wasResult) {
          if (box) box.classList.remove('show', 'open');
          setTimeout(function () {
            var res = document.querySelector('.mlv-res');
            if (res) {
              if (res.classList.contains('no')) { cue('fail'); haptic(45); }
              else { cue('win'); haptic([30, 40, 30, 40, 70]); }
            } else { cue('paid'); haptic(20); }
          }, 180);
        }
        wasResult = resultOpen;
        if (resultOpen) return;

        var pct = clockEl ? parseFloat(clockEl.style.width) : 100;
        if (!isFinite(pct)) pct = 100;
        var wallet = walletEl ? num(walletEl.textContent) : NaN;

        var count = countEl ? num(countEl.textContent) : lastCount;
        if (isFinite(count)) {
          if (count > lastCount) { cue('pop'); haptic(12); }
          lastCount = count;
        }

        var saleEl = document.querySelector('[data-mw-sale]');
        var saleOn = !!(saleEl && saleEl.classList.contains('show'));
        if (saleOn && !wasSale) { cue('sale'); haptic([20, 40, 20]); }
        wasSale = saleOn;

        var tight = (isFinite(wallet) && wallet < 5) || pct <= 15;
        if (tight && !wasTight) { cue('low'); haptic(30); }
        wasTight = tight;

        // a heartbeat in the last moments of the clock
        var now = Date.now();
        if (pct > 0 && pct <= 15 && now - lastBeat > 950) { lastBeat = now; cue('beat'); haptic([14, 60, 10]); }

        // keep the goals tab just under the top meters, clear of the banners
        if (box) {
          var hr = holder.getBoundingClientRect(), bottom = 0;
          ['[data-mw-clock]', '[data-mw-wallet]', '[data-mw-count]', '[data-mw-sale].show', '[data-mw-hike].show', '[data-mw-rival].show', '[data-mw-friend].show'].forEach(function (sel) {
            var el = document.querySelector(sel);
            if (!el) return;
            var r = el.getBoundingClientRect();
            if (r.height && r.bottom - hr.top > bottom) bottom = r.bottom - hr.top;
          });
          box.style.top = Math.round(Math.min(Math.max(bottom + 10, 56), hr.height * 0.4)) + 'px';
        }
      } catch (err) {}
    }, 160));

    try { scene.events.once('shutdown', stop); scene.events.once('destroy', stop); } catch (e) {}
  }

  function hook() {
    var W = window.MiimiidMartWow;
    if (!W) return false;
    if (W._felt) return true;
    var orig = W.start;
    W.start = function () {
      var r = orig.apply(this, arguments);
      try { begin(arguments[0] || {}); } catch (e) { console.error('mart feel failed:', e); }
      return r;
    };
    W._felt = true;
    return true;
  }
  if (!hook()) {
    var tries = 0, wait = setInterval(function () { if (hook() || ++tries > 100) clearInterval(wait); }, 100);
  }

  window.MiimiidMartFeel = API;
})();
