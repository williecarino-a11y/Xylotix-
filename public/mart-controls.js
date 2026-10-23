/*
 * MIIMIID MART CONTROLS
 * 1. The store now fills the whole screen. The dark strip under the game is gone: the joystick, Scan and Grab float over the
 *    scene on a soft shade, like a real mobile game.
 * 2. The joystick is a real SVG: glass base, fine tick ring, direction chevrons and a glowing thumb that follows your finger.
 * 3. Scan and Grab become matching glass buttons with SVG rings and an SVG scan icon. Their text, counters and states still come
 *    from the game, so nothing about how they work changes.
 * 4. Sam's message and the small status line sit above the controls instead of on the seam.
 * Visual only. The joystick movement code stays in mart-polish.js. If this file fails, the old controls still work.
 */
(function () {
  'use strict';

  function enc(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }

  var RING = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe5ff" stop-opacity=".75"/><stop offset="1" stop-color="#6fb0ff" stop-opacity=".18"/></linearGradient></defs>' +
    '<circle cx="50" cy="50" r="48.4" fill="none" stroke="url(#g)" stroke-width="1.6"/>' +
    '<circle cx="50" cy="50" r="42" fill="none" stroke="#cfe5ff" stroke-opacity=".22" stroke-width="2.4" stroke-dasharray="1 3.6"/></svg>';
  var RING_GOLD = RING.replace(/#cfe5ff/g, '#ffe3a0').replace('#6fb0ff', '#ffb43d');
  var SCAN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffd98a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="11" cy="11" r="3.2"/><path d="M13.4 13.4L16 16"/></svg>';

  var JOY_RING =
    '<svg class="mc-ring" viewBox="0 0 124 124" aria-hidden="true">' +
    '<defs><radialGradient id="mcj-base" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="#ffffff" stop-opacity=".17"/><stop offset=".7" stop-color="#0b1426" stop-opacity=".5"/><stop offset="1" stop-color="#0b1426" stop-opacity=".66"/></radialGradient>' +
    '<linearGradient id="mcj-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe5ff" stop-opacity=".9"/><stop offset="1" stop-color="#4da3ff" stop-opacity=".25"/></linearGradient></defs>' +
    '<circle cx="62" cy="62" r="60" fill="url(#mcj-base)"/>' +
    '<circle cx="62" cy="62" r="59" fill="none" stroke="url(#mcj-rim)" stroke-width="1.6"/>' +
    '<circle cx="62" cy="62" r="50" fill="none" stroke="#cfe5ff" stroke-opacity=".26" stroke-width="3" stroke-dasharray="1.3 3.83"/>' +
    '<g class="mc-chev" fill="none" stroke="#d8eaff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M56 21l6-6 6 6"/><path d="M56 103l6 6 6-6"/><path d="M21 56l-6 6 6 6"/><path d="M103 56l6 6-6 6"/></g></svg>';
  var JOY_KNOB =
    '<svg class="mc-knob" viewBox="0 0 52 52" aria-hidden="true">' +
    '<defs><radialGradient id="mck-g" cx="36%" cy="28%" r="78%"><stop offset="0" stop-color="#9fd0ff"/><stop offset=".55" stop-color="#2f7df0"/><stop offset="1" stop-color="#1650bd"/></radialGradient></defs>' +
    '<circle cx="26" cy="26" r="25" fill="url(#mck-g)"/>' +
    '<circle cx="26" cy="26" r="24.2" fill="none" stroke="#ffffff" stroke-opacity=".38" stroke-width="1.2"/>' +
    '<ellipse cx="20" cy="15" rx="11" ry="6" fill="#ffffff" fill-opacity=".28" transform="rotate(-18 20 15)"/></svg>';

  function css() {
    if (document.getElementById('mart-controls-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-controls-css';
    st.textContent =
      // the store fills the screen; the controls float over it
      '.mw > .mw-controls { position: absolute !important; left: 0; right: 0; bottom: 0; z-index: 8; background: transparent !important; pointer-events: none; ' +
      '  padding: 0 20px calc(20px + env(safe-area-inset-bottom, 0px)) !important; align-items: flex-end !important; --mc-h: 168px; }' +
      '.mw > .mw-controls::before { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 240px; background: linear-gradient(to top, rgba(5,9,20,.66), rgba(5,9,20,0)); pointer-events: none; z-index: 0; }' +
      '.mw > .mw-controls > :not(.mw-joy) { pointer-events: auto; }' +
      '.mw > .mw-controls .mw-joypad { top: -150px !important; width: 52% !important; }' +
      // messages sit above the controls
      '.mw .mw-holder .mw-asst { bottom: calc(172px + env(safe-area-inset-bottom, 0px)) !important; }' +
      '.mw .mw-holder .mw-bubble { bottom: calc(172px + env(safe-area-inset-bottom, 0px)) !important; }' +
      // SVG joystick
      '.mw .mw-joy, .mw .mw-joy.mw-joy-float, .mw .mw-joy.mw-joy-float.on { background: none !important; border: 0 !important; box-shadow: none !important; }' +
      '.mw .mw-joy.mw-joy-float { width: 124px; height: 124px; opacity: .78; position: relative; }' +
      '.mw .mw-joy.mw-joy-float.on { opacity: 1; }' +
      '.mw-joy .mc-ring { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 10px 22px rgba(0,0,0,.5)); transition: filter .2s; }' +
      '.mw-joy .mc-chev { opacity: .5; transition: opacity .2s; }' +
      '.mw-joy.on .mc-chev { opacity: .9; }' +
      '.mw-joy.on .mc-ring { filter: drop-shadow(0 10px 22px rgba(0,0,0,.5)) drop-shadow(0 0 12px rgba(77,163,255,.55)); }' +
      '.mw .mw-joy-float .mw-joy-knob { background: none !important; box-shadow: none !important; width: 52px; height: 52px; margin: -26px 0 0 -26px; filter: drop-shadow(0 5px 10px rgba(0,0,0,.5)) drop-shadow(0 0 10px rgba(77,163,255,.5)); }' +
      '.mw-joy-knob .mc-knob { display: block; width: 100%; height: 100%; }' +
      // Scan and Grab: matching glass buttons with SVG rings
      '.mw > .mw-controls .mw-scan, .mw > .mw-controls .mw-grab { position: relative; box-sizing: border-box; border: 0 !important; border-radius: 50% !important; color: #eaf1ff; ' +
      '  background: radial-gradient(circle at 50% 24%, rgba(255,255,255,.16), rgba(12,18,38,.66) 68%) !important; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); ' +
      '  box-shadow: 0 12px 28px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.18) !important; display: flex !important; flex-direction: column; align-items: center; justify-content: center; gap: 1px; ' +
      '  font-weight: 800; letter-spacing: .02em; transition: transform .12s ease, opacity .2s, box-shadow .2s; }' +
      '.mw > .mw-controls .mw-scan { width: 86px !important; height: 86px !important; margin: 0 0 8px; font-size: 11px; }' +
      '.mw > .mw-controls .mw-grab { width: 100px !important; height: 100px !important; font-size: 17px; }' +
      '.mw > .mw-controls .mw-scan::after, .mw > .mw-controls .mw-grab::after { content: ""; position: absolute; inset: 0; border-radius: 50%; pointer-events: none; background: center / 100% 100% no-repeat; }' +
      '.mw > .mw-controls .mw-grab::after { background-image: ' + enc(RING) + '; }' +
      '.mw > .mw-controls .mw-scan::after { background-image: ' + enc(RING_GOLD) + '; }' +
      '.mw > .mw-controls .mw-scan::before { content: "" !important; display: block; width: 28px; height: 28px; background: ' + enc(SCAN_ICON) + ' center / contain no-repeat; font-size: 0 !important; }' +
      '.mw > .mw-controls .mw-scan small, .mw > .mw-controls .mw-grab small { font-size: 10px; font-weight: 700; opacity: .85; max-width: 72px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
      '.mw > .mw-controls .mw-scan:disabled, .mw > .mw-controls .mw-grab:disabled { opacity: .55; }' +
      '.mw > .mw-controls .mw-grab:not(:disabled) { box-shadow: 0 12px 28px rgba(0,0,0,.45), 0 0 0 1.5px rgba(111,176,255,.85), 0 0 26px rgba(77,163,255,.55), inset 0 1px 0 rgba(255,255,255,.2) !important; ' +
      '  background: radial-gradient(circle at 50% 24%, rgba(150,200,255,.34), rgba(22,70,170,.72) 70%) !important; animation: mcReady 1.8s ease-in-out infinite; }' +
      '.mw > .mw-controls .mw-grab:not(:disabled):active, .mw > .mw-controls .mw-scan:not(:disabled):active { transform: scale(.94); }' +
      '@keyframes mcReady { 50% { box-shadow: 0 12px 28px rgba(0,0,0,.45), 0 0 0 1.5px rgba(111,176,255,.85), 0 0 36px rgba(77,163,255,.8), inset 0 1px 0 rgba(255,255,255,.2); } }' +
      '@media (prefers-reduced-motion: reduce) { .mw > .mw-controls .mw-grab:not(:disabled) { animation: none; } }';
    document.head.appendChild(st);
  }

  function enhance() {
    try {
      var joy = document.querySelector('.mw-joy:not([data-mc])');
      if (!joy) return;
      joy.setAttribute('data-mc', '1');
      joy.insertAdjacentHTML('afterbegin', JOY_RING);
      var knob = joy.querySelector('.mw-joy-knob');
      if (knob) knob.innerHTML = JOY_KNOB;
    } catch (e) { console.error('mart controls failed:', e); }
  }

  try { css(); } catch (e) { console.error('mart controls css failed:', e); }

  var queued = false;
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; enhance(); });
  }
  try {
    new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
    queue();
  } catch (e) {}
})();
