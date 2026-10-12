/*
 * MIIMIID MART WORLD (v2) - a real walkable store.
 * Phaser draws the store from parts: floor, wall, shelf units, counter, products.
 * Miimiid collides with shelves and the counter and is depth-sorted.
 * The server still owns budget, prices and answers.
 * Open the site with ?world=0 to use the old Mart.
 */
(function () {
  'use strict';

  const PHASER_URL = '/vendor/phaser.min.js';
  const PHASER_CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';
  const VIEW_W = 800;
  const VIEW_H = 1040;
  const W = 1400;
  const H = 1060;
  const WALL_H = 200;
  const SPEED = 210;
  const FACES_RIGHT = true;          // set false if Miimiid walks backwards
  const UW = 260;                    // shelf unit width
  const UH = 140;                    // shelf unit height
  const UNITS = [
    { id: 'fresh',   label: 'FRESH FOOD',     x: 80,  y: 200 },
    { id: 'dairy',   label: 'DAIRY & DRINKS', x: 380, y: 200, fridge: true },
    { id: 'snacks',  label: 'SNACKS',         x: 680, y: 200 },
    { id: 'freezer', label: 'FREEZER',        x: 980, y: 200, fridge: true },
    { id: 'care',    label: 'PERSONAL CARE',  x: 80,  y: 520 },
    { id: 'fun',     label: 'FUN CORNER',     x: 380, y: 520 }
  ];
    
  const CATS = {
fresh: ['apple', 'carrot', 'bread', 'pasta'],
dairy: ['milk', 'eggs', 'water'],
snacks: ['chips', 'cookies', 'candy'],
care: ['medicine'],
fun: ['movie', 'headphones', 'console', 'sneakers'],
freezer: ['pizza', 'icecream', 'frozendinner']
};
  const COUNTER = { x: 1000, y: 640, w: 300, h: 80 };
  const ZONE = { x: 960, y: 740, w: 380, h: 170 };
  const START = { x: 160, y: 800 };
  const GRAB_RANGE = 105;
  const ART = '/assets/fun-center/mart/';
  const NO_OVERLAY = { 'X-Continue-Loading': 'false' };   // skip the global "Please wait" overlay
  // The shopping list. The server still decides rewards; this only draws the list.
  const NEED_IDS = ['milk', 'bread', 'eggs', 'pasta', 'apple', 'carrot', 'water', 'medicine'];
  const CLOSING_SECONDS = 150;     // how long the store stays open (it pauses in menus)
  const ASSISTANT_PATH = [[1060, 430], [1200, 430], [1240, 560], [900, 560], [720, 660], [720, 820], [720, 660], [900, 560]];   // his patrol route
  const ASSISTANT_SPEED = 62;      // how fast he walks
  const PAY_GRACE_SECONDS = 25;    // after closing, time left to reach the counter
  const FRIEND_SPEED = 95;         // how fast Alex walks to you
  const CASHIER_POS = { x: 1215, y: 640 };   // where Riley stands behind the counter (tune if she looks off)
  const CUSTOMER_SPEED = 70;       // how fast the browsing customer walks
  const CUSTOMER_PICKS = ['🥛', '🍞', '🍎', '🍪', '🥕', '🍝'];
  const CUSTOMER_ROUTE = [         // his loop through the aisles (browse = stops at a shelf, pay = stops at the counter)
    { x: 800, y: 385, browse: true },
    { x: 510, y: 385, browse: true },
    { x: 210, y: 385, browse: true },
    { x: 700, y: 385 },
    { x: 700, y: 700 },
    { x: 510, y: 700, browse: true },
    { x: 210, y: 700, browse: true },
    { x: 700, y: 700 },
    { x: 1000, y: 780, pay: true },
    { x: 700, y: 700 },
    { x: 700, y: 385 }
  ];
  const saleNow = { cur: null };   // the running flash sale (the server decides it)
  const hikeNow = { cur: null };   // a price that went up mid-trip (the server decides it)
  function nowPrice(item) {
    const rp = window.MiimiidMart && window.MiimiidMart.rivalPrice ? window.MiimiidMart.rivalPrice(item.id) : null;
    if (rp !== null) return rp;
    const tp = window.MiimiidMart && window.MiimiidMart.trickPrice ? window.MiimiidMart.trickPrice(item.id) : null;
    if (tp !== null) return tp;
    const s = saleNow.cur;
    if (s && s.itemId === item.id && Date.now() < s.endsAt) return s.salePrice;
    const h = hikeNow.cur;
    if (h && h.itemId === item.id) return h.newPrice;
    return item.price;
  }
  const MM_SCALE = 0.18;    // puppet size: 910 art units tall becomes about 164px
  const CART_W = 112;       // cart width in world pixels
  const CART_GAP = 86;      // how far the cart sits beside him
  const MM_FILES = [
    'head-blank', 'eye-open-left', 'eye-open-right', 'eye-closed-left', 'eye-closed-right',
    'mouth-smile', 'mouth-open-medium', 'mouth-open-big',
    'torso-front', 'leg-front-left', 'leg-front-right',
    'arm-hanging-left', 'arm-hanging-right', 'arm-reaching-left', 'arm-reaching-right',
    'arm-bent-front-left', 'arm-bent-front-right',
    'head-back', 'torso-back', 'leg-back-left', 'leg-back-right',
    'head-side', 'torso-side', 'leg-side-straight-left', 'leg-side-straight-right'
  ];
  // [file, pivot x fraction, pivot y fraction] for each arm pose
  const MM_ARMS = {
    L: { hang: ['arm-hanging-left', 0.72, 0.07], reach: ['arm-reaching-left', 0.88, 0.30], fist: ['arm-bent-front-right', 0.12, 0.12] },
    R: { hang: ['arm-hanging-right', 0.28, 0.07], reach: ['arm-reaching-right', 0.12, 0.30], fist: ['arm-bent-front-left', 0.88, 0.12] }
  };
  // c = feet center; legs are [file, x, y, hip pivot x, hip pivot y]; head is [file, x, y, scale]
  const MM_VIEWS = {
    front: {
      c: [360, 918], hang: true,
      torso: ['torso-front', 175, 330], head: ['head-blank', 161, 9, 0.44],
      legL: ['leg-front-left', 183, 590, 83, 24], legR: ['leg-front-right', 370, 590, 80, 24],
      face: { eyeL: [196, 253], eyeR: [336, 253], mouth: [268, 306] },
      shoulder: { L: [230, 420], R: [490, 420] }
    },
    back: {
      c: [350, 911], hang: false,
      torso: ['torso-back', 174, 330], head: ['head-back', 183, 27, 1],
      legL: ['leg-back-left', 174, 583, 86, 24], legR: ['leg-back-right', 354, 583, 76, 24],
      shoulder: { L: [224, 420], R: [477, 420] }
    },
    side: {
      c: [350, 930],
      torso: ['torso-side', 234, 330], head: ['head-side', 110, 36, 1],
      legL: ['leg-side-straight-left', 277, 589, 66, 24], legR: ['leg-side-straight-right', 293, 589, 66, 24]
    }
  };

  let originalStart = window.startMiimiidShop;
  let game = null;
  let phaserPromise = null;

  // Sounds made in code, so there are no audio files to upload.
  const SFX = {
    ctx: null, master: null, muted: false, timer: null, beat: 0,
    init() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.muted ? 0 : 0.9;
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { /* no audio available */ }
    },
    tone(f, dur, type, vol, delay) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = this.ctx.createBufferSource();
      s.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq || 1200;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      s.connect(f);
      f.connect(g);
      g.connect(this.master);
      s.start();
    },
    step() { this.noise(0.07, 0.09, 380 + Math.random() * 120); },
    reach() { this.noise(0.18, 0.05, 1800); },
    pickup() { this.tone(660, 0.09, 'triangle', 0.16); this.tone(990, 0.14, 'triangle', 0.16, 0.08); },
    coin() { this.tone(988, 0.1, 'square', 0.08); this.tone(1319, 0.35, 'square', 0.08, 0.09); this.noise(0.12, 0.08, 5000); },
    startMusic() {
      if (this.timer || !this.ctx) return;
      const chords = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
      const penta = [523.25, 587.33, 659.25, 783.99, 880.0];
      this.beat = 0;
      this.timer = setInterval(() => {
        const b = this.beat++;
        const ch = chords[Math.floor(b / 8) % 4];
        const i = b % 8;
        this.tone(ch[i % 3], 0.26, 'triangle', 0.045);
        if (i === 0) this.tone(ch[0] / 2, 0.55, 'sine', 0.07);
        if (i % 4 === 2 && Math.random() < 0.75) this.tone(penta[Math.floor(Math.random() * penta.length)], 0.32, 'triangle', 0.03);
      }, 290);
    },
    stopMusic() { if (this.timer) { clearInterval(this.timer); this.timer = null; } },
    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.9;
      return this.muted;
    }
  };

  try {
    if (window.MiimiidMart && window.MiimiidMart.audio) window.MiimiidMart.audio.upgrade(SFX);
    const q = new URLSearchParams(location.search).get('world');
    if (q === '1') localStorage.removeItem('miimiidWorld');
    if (q === '0') localStorage.setItem('miimiidWorld', '0');
  } catch (e) { /* ignore */ }

  function worldOn() {
    try { return localStorage.getItem('miimiidWorld') !== '0'; } catch (e) { return true; }
  }

  function esc(v) { return miimiidFunCenterEscapeHtml(v); }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }

  function loadPhaser() {
    if (window.Phaser) return Promise.resolve();
    if (phaserPromise) return phaserPromise;
    phaserPromise = loadScript(PHASER_URL).catch(() => loadScript(PHASER_CDN_FALLBACK));
    return phaserPromise;
  }

  function injectStyles() {
    if (document.getElementById('mw-styles')) return;
    const st = document.createElement('style');
    st.id = 'mw-styles';
    st.textContent = `
      .mw { max-width: 440px; margin: 0 auto; padding-bottom: 12px; }
      .mw-top { display: flex; align-items: center; gap: 10px; padding: 8px 4px; color: #e6e9f0; font-weight: 700; }
      .mw-top .mw-wallet { flex: 1; font-size: 18px; }
      .mw-top .mw-count { background: #131a2c; border: 1px solid #232c42; border-radius: 999px; padding: 4px 12px; }
      .mw-leave { background: transparent; border: 1px solid #232c42; color: #9aa4bd; border-radius: 999px; padding: 6px 12px; cursor: pointer; }
      .mw-holder { position: relative; width: 100%; aspect-ratio: ${VIEW_W} / ${VIEW_H}; border-radius: 18px; overflow: hidden; background: #0d1324; border: 1px solid #232c42; }
      .mw-holder canvas { display: block; }
      .mw-bubble { position: absolute; left: 10px; right: 10px; bottom: 10px; background: rgba(19, 26, 44, 0.92); border: 1px solid #232c42; color: #e6e9f0; border-radius: 14px; padding: 10px 12px; font-size: 14px; line-height: 1.35; pointer-events: none; z-index: 5; }
      .mw-overlay { position: absolute; inset: 0; background: rgba(8, 12, 24, 0.82); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 8; }
      .mw-card { width: 100%; box-sizing: border-box; max-height: 100%; overflow-y: auto; background: #131a2c; border: 1px solid #232c42; border-radius: 18px; padding: 16px; color: #e6e9f0; text-align: center; }
      .mw-card h3 { margin: 0 0 8px; color: #4da3ff; }
      .mw-card p { margin: 6px 0; font-size: 14px; }
      .mw-card button { margin-top: 8px; width: 100%; border: 0; border-radius: 999px; padding: 12px; font-weight: 800; background: #1f6feb; color: #fff; cursor: pointer; }
      .mw-card button.mw-alt { background: transparent; border: 1px solid #232c42; color: #9aa4bd; }
      .mw-card button:disabled { background: #232c42; color: #5d6785; opacity: .55; cursor: default; }
      .mw-opt { display: flex; justify-content: space-between; align-items: center; }
      .mw-list { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 2px 4px 8px; }
      .mw-list-title { width: 100%; font-size: 12px; font-weight: 800; color: #9ec5ff; letter-spacing: .04em; text-transform: uppercase; }
      .mw-chip { font-size: 12px; font-weight: 700; color: #e6e9f0; background: #131a2c; border: 1px solid #232c42; border-radius: 999px; padding: 3px 9px; }
      .mw-chip::before { content: '○ '; color: #6f7ba0; }
      .mw-chip.done { color: #7ee2a8; border-color: #1f8a5b; background: rgba(31, 138, 91, 0.16); text-decoration: line-through; animation: mwPop .35s ease-out; }
      .mw-chip.done::before { content: '✓ '; color: #7ee2a8; }
      @keyframes mwPop { 0% { transform: scale(1); } 50% { transform: scale(1.18); } 100% { transform: scale(1); } }
      .mw-clock { display: flex; align-items: center; gap: 8px; padding: 0 4px 6px; font-size: 12px; font-weight: 800; color: #9aa4bd; }
      .mw-clock-bar { flex: 1; height: 8px; border-radius: 999px; background: #131a2c; border: 1px solid #232c42; overflow: hidden; }
      .mw-clock-fill { height: 100%; width: 100%; border-radius: 999px; background: #3fb6ff; transition: width .4s linear, background .4s; }
      .mw-clock-fill[data-level="mid"] { background: #ffb020; }
      .mw-clock-fill[data-level="low"] { background: #ff5d5d; animation: mwPulse .8s ease-in-out infinite; }
      @keyframes mwPulse { 50% { opacity: .55; } }
      .mw-combo { display: none; margin: 0 4px 6px; padding: 5px 10px; border-radius: 10px; background: linear-gradient(90deg, #1f8a5b, #3fb6ff); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; }
      .mw-combo.show { display: block; animation: mwPop .35s ease-out; }
      .mw-asst { position: absolute; left: 10px; right: 10px; top: 10px; display: none; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.96); border: 2px solid #2f9e6b; color: #1b2440; border-radius: 14px; padding: 8px 12px; font-size: 14px; line-height: 1.3; pointer-events: none; z-index: 6; }
      .mw-asst.show { display: flex; animation: mwSlide .25s ease-out; }
      .mw-asst-face { width: 34px; height: 34px; flex: none; border-radius: 50%; background: #2f9e6b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
      .mw-asst b { display: block; font-size: 11px; color: #2f9e6b; text-transform: uppercase; letter-spacing: .04em; }
      @keyframes mwSlide { from { transform: translateY(-10px); opacity: 0; } to { transform: none; opacity: 1; } }
      .mw-asst.ask { pointer-events: auto; }
      .mw-asst-replies { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .mw-asst-replies:empty { display: none; }
      .mw-reply { border: 2px solid #2f9e6b; background: #ffffff; color: #1b6b48; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 800; cursor: pointer; }
      .mw-reply:active { background: #2f9e6b; color: #ffffff; }
      .mw-sale { display: none; margin: 0 4px 6px; padding: 6px 10px; border-radius: 10px; background: linear-gradient(90deg, #e0245e, #ff7a1a); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; animation: mwPulse .9s ease-in-out infinite; }
      .mw-sale.show { display: block; }
      .mw-hike { display: none; margin: 0 4px 6px; padding: 6px 10px; border-radius: 10px; background: #3a1620; border: 1px solid #ff5d5d; color: #ffb4b4; font-size: 13px; font-weight: 800; text-align: center; }
      .mw-hike.show { display: block; }
      .mw-controls { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 0; }
      .mw-joy { position: relative; width: 108px; height: 108px; border-radius: 50%; background: rgba(77, 163, 255, 0.12); border: 2px solid rgba(77, 163, 255, 0.45); touch-action: none; user-select: none; }
      .mw-joy-knob { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #1f6feb; box-shadow: 0 4px 12px rgba(0,0,0,.4); pointer-events: none; transition: transform .1s ease-out; }
      .mw-grab { width: 104px; height: 104px; border-radius: 50%; border: 3px solid #4da3ff; background: #1f6feb; color: #fff; font-size: 16px; font-weight: 800; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; }
      .mw-grab small { font-size: 11px; font-weight: 600; max-width: 84px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mw-grab:disabled { opacity: .4; background: #232c42; border-color: #232c42; cursor: default; }
      .mw { padding-bottom: 90px; }
      .mw-holder { border: 0; border-radius: 22px; }
      .mw-hud { position: absolute; left: 8px; right: 8px; top: 8px; z-index: 7; display: flex; flex-direction: column; gap: 5px; pointer-events: none; }
      .mw-hud button, .mw-hud summary, .mw-hud details { pointer-events: auto; }
      .mw-hud .mw-top { padding: 0; gap: 6px; font-size: 13px; }
      .mw-hud .mw-top .mw-wallet { flex: none; font-size: 14px; background: rgba(8, 14, 30, 0.62); border-radius: 999px; padding: 5px 12px; }
      .mw-hud .mw-count { background: rgba(8, 14, 30, 0.62); border: 0; padding: 5px 10px; font-size: 13px; }
      .mw-hud .mw-leave { background: rgba(8, 14, 30, 0.62); border: 0; padding: 5px 10px; font-size: 13px; }
      .mw-hud [data-mw-mute] { margin-left: auto; }
      .mw-hud .mw-clock { padding: 3px 10px; font-size: 11px; background: rgba(8, 14, 30, 0.55); border-radius: 999px; }
      .mw-hud .mw-clock-bar { height: 6px; }
      .mw-hud .mw-combo, .mw-hud .mw-sale, .mw-hud .mw-hike { margin: 0; font-size: 12px; padding: 4px 10px; border-radius: 999px; }
      .mw-hud .mw-list { padding: 0; gap: 5px; align-items: center; }
      .mw-hud .mw-list details { width: auto !important; background: rgba(8, 14, 30, 0.62); border-radius: 12px; padding: 3px 10px; }
      .mw-hud .mw-list-title { width: auto; font-size: 11px; }
      .mw-hud .mw-chip { font-size: 0; width: 14px; height: 14px; padding: 0; border-radius: 50%; border: 2px solid #8fa0c8; background: rgba(8, 14, 30, 0.62); text-decoration: none; }
      .mw-hud .mw-chip::before, .mw-hud .mw-chip.done::before { content: ''; }
      .mw-hud .mw-chip.done { background: #2fbf7a; border-color: #7ee2a8; }
      .mw-hud > * { margin: 0 !important; }
      .mw-asst { top: auto; bottom: 64px; }
      .mw { position: fixed; inset: 0; z-index: 9000; max-width: none; margin: 0; padding: 0; background: #0b1220; display: flex; flex-direction: column; }
      .mw-holder { flex: 1 1 auto; min-height: 0; width: 100%; aspect-ratio: auto; border-radius: 0; background: #0b1220; }
      .mw-controls { flex: none; padding: 8px 18px calc(14px + env(safe-area-inset-bottom, 0px)); background: #0b1220; }
      .mw-hud { gap: 4px; }
      .mw-hud .mw-clock { order: -1; font-size: 10px; padding: 2px 10px; }
      .mw-hud .mw-top .mw-wallet { font-size: 13px; padding: 4px 10px; }
      .mw-hud .mw-count, .mw-hud .mw-leave { font-size: 12px; padding: 4px 9px; }
      .mw-hud .mw-combo, .mw-hud .mw-sale, .mw-hud .mw-hike { font-size: 11px; padding: 3px 10px; }
      .mw-hud .mw-list details { padding: 2px 9px; }
      .mw-hud .mw-list-title { font-size: 10px; }
      .mw-asst { left: 8px; right: 8px; padding: 6px 10px; gap: 8px; font-size: 12px; line-height: 1.25; border-width: 1px; border-radius: 12px; }
      .mw-asst-face { width: 26px; height: 26px; font-size: 15px; }
      .mw-asst b { font-size: 10px; }
      .mw-reply { padding: 4px 10px; font-size: 12px; border-width: 1px; }
      .mw-bubble { left: 8px; right: 8px; bottom: 10px; padding: 6px 10px; font-size: 12px; line-height: 1.25; border: 0; border-radius: 12px; background: rgba(8, 14, 30, 0.72); }
      .mw-asst-face { color: #ffffff; font-weight: 800; font-size: 14px; }
      .mw-count { display: inline-flex; align-items: center; gap: 6px; }
      .mw-hud .mw-top .mw-clock { flex: 1; min-width: 0; padding: 4px 10px; }
      .mw-hud .mw-top .mw-clock span { white-space: nowrap; font-size: 10px; }
      .mw-hud [data-mw-mute] { display: inline-flex; align-items: center; justify-content: center; }
      .mw-count svg, .mw-hud [data-mw-mute] svg { display: block; }
      .mw-scan::before { content: 'Scan'; font-size: 15px; font-weight: 800; }
      .mw-bubble { transition: opacity .4s; }
    `;
    document.head.appendChild(st);
  }

  function productSource(item) {
    const box = document.createElement('div');
    box.innerHTML = miimiidFunProductVisual(item, 44);
    const img = box.querySelector('img');
    if (img && img.getAttribute('src')) return { src: img.getAttribute('src') };
    return { emoji: (box.textContent || '').trim() || '🛒' };
  }

  function hasOptions(item) { return Array.isArray(item.options) && item.options.length > 0; }
  function lowest(item) { return hasOptions(item) ? Math.min(...item.options.map(o => o.price)) : item.price; }
  function highest(item) { return hasOptions(item) ? Math.max(...item.options.map(o => o.price)) : item.price; }
  function priceText(item) {
    if (!hasOptions(item)) return `$${nowPrice(item)}`;
    const lo = lowest(item);
    const hi = highest(item);
    return lo === hi ? `$${lo}` : `$${lo}-$${hi}`;
  }

  function nearestProduct(scene) {
    const px = scene.player.x;
    const py = scene.player.y;
    let best = null;
    let bd = GRAB_RANGE;
    scene.products.forEach(p => {
      if (p.fridge && !p.fridge.open) return;     // the fridge door must be open
    if (py < p.sy + 4) return;     // must stand in front of the shelf (empty slots count, for Put back)
      const d = Math.hypot(p.x - px, (p.sy + 14) - py);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  function inCheckoutZone(scene) {
    const x = scene.player.x;
    const y = scene.player.y;
    return x >= ZONE.x && x <= ZONE.x + ZONE.w && y >= ZONE.y && y <= ZONE.y + ZONE.h;
  }

  async function startWorld() {
    const content = document.getElementById('fun-center-content');
    if (!content) return;
    content.innerHTML = '<div class="miimiid-fun-loading">Entering the store…</div>';

    try {
      await loadPhaser();
      const shop = await miimiidFunCenterRequest('/api/fun-center/shop', { headers: NO_OVERLAY });
      const session = await miimiidFunCenterRequest('/api/fun-center/shop/session', {
        method: 'POST', body: JSON.stringify({}), headers: NO_OVERLAY
      });
      mountWorld(content, shop, session);
    } catch (error) {
      console.error('Miimiid world failed, using the normal Mart:', error);
      if (typeof originalStart === 'function') originalStart();
    }
  }

  function destroyGame() {
    SFX.stopMusic();
    if (game) { try { game.destroy(true); } catch (e) { /* ignore */ } game = null; }
  }

  function mountWorld(content, shop, session) {
    injectStyles();
    destroyGame();

    const S = {
      shop,
      sessionId: session.sessionId,
      budget: session.budget,
      spent: 0,
      basket: [],
      busy: false,
      ctl: { x: 0, y: 0 },
      nearId: null,
      zoneHint: false,
      timeLeft: CLOSING_SECONDS,
      closed: false,
      graceUsed: false,
      warned: false
    };

    content.innerHTML = `
      <div class="mw">
        <div class="mw-top">
          <span class="mw-wallet">Wallet <span data-mw-wallet>$${S.budget}</span></span>
          <span class="mw-count"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11l2-8H6"/></svg><span data-mw-count>0</span></span>
          <div class="mw-clock"><span>Store closes</span><div class="mw-clock-bar"><div class="mw-clock-fill" data-mw-clock data-level="high"></div></div></div>
          <button type="button" class="mw-leave" data-mw-mute aria-label="Sound"></button>
          <button type="button" class="mw-leave" data-mw-leave>Leave</button>
        </div>
        <div class="mw-combo" data-mw-combo></div>
        <div class="mw-sale" data-mw-sale></div>
        <div class="mw-hike" data-mw-hike></div>
        <div class="mw-list" data-mw-list></div>
        <div class="mw-holder" data-mw-holder>
          <div class="mw-asst" data-mw-asst><span class="mw-asst-face">🧑‍🍳</span><div><b>Sam · Store assistant</b><span data-mw-asst-text></span><div class="mw-asst-replies" data-mw-asst-replies></div></div></div>
          <div class="mw-bubble" data-mw-bubble>Check your list! Grab what you need and keep an eye on your wallet.</div>
        </div>
        <div class="mw-controls">
          <div class="mw-joy" data-mw-joy><div class="mw-joy-knob" data-mw-knob></div></div>
          <button type="button" class="mw-scan" data-mw-scan disabled>🔍<small>Scan</small></button>
          <button type="button" class="mw-grab" data-mw-grab disabled>✋ Grab</button>
        </div>
      </div>
    `;

    const holder = content.querySelector('[data-mw-holder]');
    const bubble = content.querySelector('[data-mw-bubble]');
    const walletEl = content.querySelector('[data-mw-wallet]');
    const countEl = content.querySelector('[data-mw-count]');
    const grabBtn = content.querySelector('[data-mw-grab]');

    let bubbleTimer = 0;
    function say(text) {
      bubble.textContent = text;
      bubble.style.opacity = '1';
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => { bubble.style.opacity = '0'; }, 5000);
    }
    say(bubble.textContent);

    // closing-time clock: gentle, pauses while a menu or payment is open
    const clockFill = content.querySelector('[data-mw-clock]');
    let lastPct = -1;
    function tickClock(dt) {
      if (S.busy || S.closed) return;
      S.timeLeft = Math.max(0, S.timeLeft - dt);
      const pct = Math.round((S.timeLeft / CLOSING_SECONDS) * 100);
      if (pct !== lastPct) {
        lastPct = pct;
        clockFill.style.width = pct + '%';
        clockFill.dataset.level = pct <= 15 ? 'low' : pct <= 40 ? 'mid' : 'high';
      }
      if (!S.warned && pct <= 25) {
        S.warned = true;
        say('The store closes soon! Think about what you still need.');
        assistant.react('warn');
      }
      if (S.timeLeft <= 0) {
        if (S.basket.length === 0 && !S.graceUsed) {
          S.graceUsed = true;
          S.timeLeft = 30;
          say('Closing soon, and your cart is empty. Here is a little extra time!');
          return;
        }
        S.closed = true;
        S.payLeft = PAY_GRACE_SECONDS;
        SFX.tone(330, 0.35, 'triangle', 0.1);
        SFX.tone(247, 0.5, 'triangle', 0.1, 0.18);
        say('Closing time! You have ' + PAY_GRACE_SECONDS + ' seconds to reach the counter and pay.');
        assistant.react('closed');
      }
    }
    // shop assistant: reacts to what you do, never says need or want
    const assistant = {
      greeted: false, lowSaid: false, tightSaid: false, lastLine: '', lastAt: 0,
      lines: {
        greet: ['Welcome to Miimiid Mart! Check your list and watch your wallet.', 'Hi there! Prices are on the shelves. Take your time, but not too long!', 'Welcome in! Have a plan before you fill that cart.', 'Hello! Tip: the total matters more than any single price.'],
        first: ['First one in the cart! Keep an eye on the total.', 'Off to a start! Remember, every dollar counts.', 'And we are rolling! Keep counting as you go.', 'Good start. Now keep an eye on the wallet.'],
        cheap: ['Easy on the wallet.', 'Small price, small dent.', 'Little things add up, so keep counting.', 'Cheap is nice. Count the total anyway.', 'That one barely moves the needle.', 'Good price. How is the rest of your budget?'],
        mid: ['Good one. Keep an eye on the total.', 'That adds up. Check your wallet now and then.', 'A fair price, but the total is growing.', 'Not tiny, not huge. Watch the wallet.', 'Fine, as long as there is room for the rest.'],
        pricey: ['Oof, that one costs a lot. Will you have enough left?', 'Big price tag! Make sure it fits your plan.', 'That is a big bite out of the wallet.', 'Pricey! Is there enough left for the rest of the list?', 'Think about what else that money could buy.'],
        low: ['Your wallet is getting light. Count carefully!', 'Under $10 left. Choose wisely.', 'Getting close to the bottom of the wallet.', 'Careful now, the wallet is running low.'],
        tight: ['Only a few dollars left! Be careful now.', 'Almost out of money! Think before you grab.', 'Nearly empty. Every dollar matters now.', 'Just a few dollars left. Pick carefully.'],
        putback: ['Changing your mind? Thinking twice is smart.', 'Back it goes. Every dollar counts.', 'Good thinking, a second look never hurts.', 'Put back and money back. Nice.', 'Better to decide now than regret it later.'],
        warn: ['We close soon! Anything you forgot?', 'Clock is ticking. Is your cart ready?', 'Closing time is coming. Check your list!', 'Last chance to grab what you came for.'],
        closed: ['Closing time! Please head to the counter.', 'We are closed. Time to pay at the counter.', 'That is the bell! Off to the counter.']
      },
      pending: false,
      say(text, replies, who, onClose) {
        const ask = !!(replies && replies.length);
        if (this.pending && !ask) return;          // a question is waiting for an answer
        const box = holder.querySelector('[data-mw-asst]');
        if (!box) return;
        const rb = box.querySelector('[data-mw-asst-replies]');
        const person = who || { name: 'Sam · Store assistant', face: '🧑‍🍳' };
        box.querySelector('b').textContent = person.name;
        box.querySelector('.mw-asst-face').textContent = (person.name || 'S').trim().charAt(0);
        box.querySelector('[data-mw-asst-text]').textContent = text;
        rb.innerHTML = '';
        clearTimeout(this.hideTimer);
        const close = () => {
          this.pending = false;
          box.classList.remove('ask');
          rb.innerHTML = '';
        };
        this.pending = ask;
        box.classList.toggle('ask', ask);
        box.classList.add('show');
        if (ask) {
          replies.forEach(rp => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mw-reply';
            b.textContent = rp.label;
            b.addEventListener('click', () => {
              close();
              clearTimeout(this.hideTimer);
              say('You: ' + rp.label);                 // Miimiid's own bubble
              if (rp.action) rp.action();
              if (onClose) onClose();
              setTimeout(() => assistant.say(rp.answer, null, who), 600);
            });
            rb.appendChild(b);
          });
        }
        this.hideTimer = setTimeout(() => {
          box.classList.remove('show');
          if (ask) { close(); if (onClose) onClose(); }
        }, ask ? 14000 : 4200);
        const scene = game && game.scene.getScene('mart');
        if (!who && scene && scene.shopkeeperTalk) scene.shopkeeperTalk();
      },
      pick(key) {
        const list = this.lines[key];
        let line = list[Math.floor(Math.random() * list.length)];
        if (list.length > 1 && line === this.lastLine) line = list[(list.indexOf(line) + 1) % list.length];
        this.lastLine = line;
        return line;
      },
      react(kind, d) {
        if (kind === 'greet') {
          this.lastAt = Date.now();
          this.say(this.pick('greet'), [
            { label: 'Hi Sam! 👋', answer: 'Hi! Nice to meet you. Shout if you need help.' },
            { label: 'Just looking', answer: 'No problem. Take your time, but watch the clock!' },
            { label: 'Any tips?', answer: 'Yes! Get the things you must have first, then see what money is left.' }
          ]);
          return;
        }
        if (kind === 'hike') {
          this.lastAt = Date.now();
          this.say(`${d.name} just went up $${d.up}! Prices change, so buying the things you must have early can save money.`);
          return;
        }
        if (kind === 'grab') {
          if (d.left <= 5 && !this.tightSaid) { this.tightSaid = true; kind = 'tight'; }
          else if (d.left <= 10 && !this.lowSaid) { this.lowSaid = true; kind = 'low'; }
          else if (d.count === 1) kind = 'first';
          else kind = d.price <= 3 ? 'cheap' : d.price >= 12 ? 'pricey' : 'mid';
        }
        const now = Date.now();
        if (now - this.lastAt < 900 && kind !== 'closed') return;
        this.lastAt = now;
        this.say(this.pick(kind));
      }
    };

    // flash sale: asked for once, about 40% into the trip. The server picks the item, price and end time.
    saleNow.cur = null;
    const saleEl = content.querySelector('[data-mw-sale]');
    let saleAsked = false;
    let saleTick = 0;
    async function startSale() {
      try {
        const r = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/sale/start`,
          { method: 'POST', body: JSON.stringify({}), headers: NO_OVERLAY }
        );
        if (!r || !r.started) return;
        saleNow.cur = { itemId: r.itemId, name: r.name, label: r.label, normalPrice: r.normalPrice, salePrice: r.salePrice, endsAt: Date.now() + r.seconds * 1000 };
        SFX.tone(880, 0.12, 'square', 0.06);
        SFX.tone(1175, 0.2, 'square', 0.06, 0.12);
        assistant.say(`FLASH SALE! ${r.name} is $${r.salePrice} instead of $${r.normalPrice} for ${r.seconds} seconds. Is it on your list?`, [
          { label: 'It is on my list', answer: 'Hmm, I do not see it on your list. A deal only helps if you need the thing.' },
          { label: 'Not on my list', answer: 'Smart! A discount on something you do not need is still spending.' },
          { label: 'I want it!', answer: 'Fair. Treats are fine once the things you must have are covered.' }
        ]);
        const scene = game && game.scene.getScene('mart');
        if (scene && scene.refreshSale) scene.refreshSale();
      } catch (error) {
        console.error('flash sale error:', error);
      }
    }
    function tickSale(dt) {
      if (!saleAsked && !S.closed && !S.busy && (S.basket.length >= 3 || S.timeLeft <= CLOSING_SECONDS * 0.8)) {
        saleAsked = true;
        startSale();
      }
      const sale = saleNow.cur;
      if (!sale) return;
      const left = Math.max(0, Math.ceil((sale.endsAt - Date.now()) / 1000));
      let ended = false;
      if (left > 0) {
        saleEl.classList.add('show');
        saleEl.textContent = `⚡ FLASH SALE: ${sale.name} $${sale.salePrice} (was $${sale.normalPrice}) · ${left}s`;
      } else {
        ended = true;
        saleNow.cur = null;
        saleEl.classList.remove('show');
        if (!S.basket.includes(sale.itemId)) assistant.say('The sale just ended. Prices are back to normal.');
      }
      saleTick += dt;
      if (ended || saleTick > 0.5) {
        saleTick = 0;
        const scene = game && game.scene.getScene('mart');
        if (scene && scene.refreshSale) scene.refreshSale();
      }
    }

    // price rise: one essential costs more from now on. The server decides which and by how much.
    hikeNow.cur = null;
    const hikeEl = content.querySelector('[data-mw-hike]');
    let hikeAsked = false;
    let hikeHideAt = 0;
    async function startHike() {
      try {
        const r = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/hike/start`,
          { method: 'POST', body: JSON.stringify({}), headers: NO_OVERLAY }
        );
        if (!r || !r.started) return;
        hikeNow.cur = { itemId: r.itemId, name: r.name, oldPrice: r.oldPrice, newPrice: r.newPrice };
        SFX.tone(220, 0.25, 'sawtooth', 0.05);
        SFX.tone(165, 0.4, 'sawtooth', 0.05, 0.2);
        hikeEl.textContent = `📈 PRICE UP: ${r.name} $${r.oldPrice} → $${r.newPrice}`;
        hikeEl.classList.add('show');
        hikeHideAt = Date.now() + 9000;
        assistant.react('hike', { name: r.name, up: r.newPrice - r.oldPrice });
        const scene = game && game.scene.getScene('mart');
        if (scene && scene.refreshSale) scene.refreshSale();
      } catch (error) {
        console.error('price rise error:', error);
      }
    }
    function tickHike() {
      if (!hikeAsked && !S.closed && !S.busy && !saleNow.cur && !(rivalCtl && rivalCtl.active()) && (S.basket.length >= 5 || S.timeLeft <= CLOSING_SECONDS * 0.55)) {
        hikeAsked = true;
        startHike();
      }
      if (hikeHideAt && Date.now() > hikeHideAt) {
        hikeHideAt = 0;
        hikeEl.classList.remove('show');
      }
    }

    // closing rule: after the store closes, the player has PAY_GRACE_SECONDS to reach the counter.
    const clockLabel = content.querySelector('.mw-clock span');
    let forcedDone = false;
    function tickClosing(dt) {
      if (!S.closed || forcedDone || S.busy) return;
      S.payLeft = Math.max(0, S.payLeft - dt);
      clockLabel.textContent = `🔒 Closed: pay in ${Math.ceil(S.payLeft)}s`;
      clockFill.style.width = Math.round((S.payLeft / PAY_GRACE_SECONDS) * 100) + '%';
      clockFill.dataset.level = 'low';
      if (S.payLeft <= 8 && !S.payWarned) {
        S.payWarned = true;
        assistant.say('Please head to the counter now! I will ring you up in a few seconds.');
      }
      if (S.payLeft <= 0) {
        forcedDone = true;
        forceCheckout();
      }
    }
    function forceCheckout() {
      if (S.basket.length === 0) { walkedOut(); return; }
      assistant.say('Time is up! The cashier will ring you up now.');
      doCheckout(true);
    }
    function walkedOut() {
      S.busy = true;
      SFX.tone(247, 0.5, 'triangle', 0.1);
      const o = overlay(`
        <h3>The store closed</h3>
        <p>Time ran out and your cart was empty, so you left with nothing.</p>
        <p>Your wallet is safe, but your essentials for the week are not covered.</p>
        <button type="button" data-again>Try again</button>
        <button type="button" class="mw-alt" data-back>Back to Fun Center</button>
      `);
      o.querySelector('[data-again]').addEventListener('click', () => { destroyGame(); startWorld(); });
      o.querySelector('[data-back]').addEventListener('click', () => { destroyGame(); renderMiimiidFunCenter(); });
    }

    // friend event: Alex pops in, asks about movie night, then leaves.
    let friendAsked = false;
    function tickFriend() {
      if (friendAsked || S.closed || S.busy) return;
      const movie = shop.items.find(it => it.id === 'movie');
      if (!movie || S.basket.includes('movie')) return;
      if (S.basket.length < 2) return;
      if (S.basket.length < 6 && S.timeLeft > CLOSING_SECONDS * 0.4) return;
      if (saleNow.cur || hikeHideAt || assistant.pending || (rivalCtl && rivalCtl.active())) return;
      if (S.budget - S.spent < nowPrice(movie)) return;
      const scene = game && game.scene.getScene('mart');
      if (!scene || scene.friend) return;
      friendAsked = true;
      scene.spawnFriend();
    }
    function friendAsk() {
      const movie = shop.items.find(it => it.id === 'movie');
      const price = movie ? nowPrice(movie) : 12;
      const who = { name: 'Alex · Your friend', face: '🧑' };
      assistant.say(`Hey! Movie night tonight? Tickets are $${price}. You in?`, [
        { label: "I'm in! 🎬", answer: 'Yes! It is going to be fun!', action: buyMovie },
        { label: 'Maybe next time', answer: 'No worries, we will catch the next one!' }
      ], who, friendDone);
    }
    function buyMovie() {
      const scene = game && game.scene.getScene('mart');
      const p = scene && scene.products.find(q => q.item.id === 'movie');
      if (p && !p.taken) buyProduct(scene, p);
    }
    function friendDone() {
      const scene = game && game.scene.getScene('mart');
      if (scene && scene.friend && scene.friend.state === 'ask') {
        scene.friend.state = 'out';
        scene.friend.waveUntil = scene.time.now + 1200;
      }
    }

   // store tips: every so often a friendly announcement about money
    const TIPS = [
      'Tip: write your list before you shop.',
      'Tip: compare prices on the shelf before you grab.',
      'Tip: a sale only saves money on things you need.',
      'Tip: the total matters more than any one price.',
      'Tip: keep a little left over for surprises.'
    ];
    let tipLeft = 28;
    function tickAmbient(dt) {
      if (S.busy || S.closed || assistant.pending || saleNow.cur || hikeHideAt) return;
      tipLeft -= dt;
      if (tipLeft > 0) return;
      tipLeft = 38 + Math.random() * 20;
      SFX.tone(784, 0.12, 'sine', 0.05);
      SFX.tone(659, 0.2, 'sine', 0.05, 0.12);
      say(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }
    
    // cashier: waves when you reach the counter, checks your cart against your list, offers to ring you up.
    let atPay = false;
    function tickCashier() {
      const scene = game && game.scene.getScene('mart');
      if (!scene || !scene.ck) return;
      if (!inCheckoutZone(scene)) { atPay = false; return; }
      if (atPay) return;
      atPay = true;
      scene.ck.waveUntil = scene.time.now + 1500;
      if (S.busy || S.basket.length === 0 || assistant.pending || scene.friend) return;
      cashierAsk(scene);
    }
    function cashierAsk(scene) {
      const who = { name: 'Riley · Cashier', face: '🧑‍💼' };
      const missing = needItems.filter(n => !S.basket.includes(n.id));
      const left = S.budget - S.spent;
      scene.ck.talkUntil = scene.time.now + 14000;
      const done = () => { scene.ck.talkUntil = scene.time.now + 1500; };
      const ring = { label: 'Ring me up 🧾', answer: 'Scanning now. Let us see how you did!', action: scanThenCheckout };
      const warn = weekCtl && !S.closed ? weekCtl.warning() : '';
      if (warn) {
        assistant.say(warn, [
          { label: 'Let me fix that', answer: 'Good idea. I will be right here.' },
          { label: 'Ring me up anyway', answer: 'Okay. Scanning now.', action: scanThenCheckout }
        ], who, done);
        return;
      }
      if (S.closed) {
        const text = missing.length
          ? `We are closed, so this is the last call. You are missing ${missing.length} from your list.`
          : `We are closed, but you have everything on your list. Ready to pay?`;
        assistant.say(text, [ring], who, done);
        return;
      }
      if (missing.length === 0) {
        assistant.say(`You have everything on your list, with $${left} left. Ready to pay?`, [
          ring,
          { label: 'One more look', answer: 'Sure, take your time.' }
        ], who, done);
        return;
      }
      const names = missing.slice(0, 2).map(m => m.name).join(' and ');
      const more = missing.length > 2 ? ` and ${missing.length - 2} more` : '';
      assistant.say(`Before we finish: you still need ${names}${more} from your list.`, [
        { label: 'Let me go back', answer: 'Good idea. I will be right here.' },
        { label: 'Ring me up anyway', answer: 'Okay. Scanning now.', action: scanThenCheckout }
      ], who, done);
    }
    function scanThenCheckout() {
      if (S.busy || S.basket.length === 0) return;
      S.busy = true;
      const ids = S.basket.slice(0, 10);
      ids.forEach((id, i) => {
        setTimeout(() => {
          if (!document.body.contains(holder)) return;
          const it = shop.items.find(x => x.id === id);
          SFX.tone(1200, 0.07, 'square', 0.07);
          say('Scanning: ' + (it ? it.name : 'item'));
        }, i * 350);
      });
      setTimeout(() => {
        S.busy = false;
        if (document.body.contains(holder)) doCheckout();
      }, ids.length * 350 + 300);
    }

    // rival shopper (code lives in public/fun-center-rival.js)
    const rivalCtl = window.MiimiidMart && window.MiimiidMart.rival ? window.MiimiidMart.rival.create({
      S, content, assistant, say, SFX, NO_OVERLAY, shop,
      request: miimiidFunCenterRequest,
      closingSeconds: CLOSING_SECONDS,
      priceText,
      saleActive: () => !!saleNow.cur,
      hikeShowing: () => !!hikeHideAt,
      getScene: () => (game && game.scene.getScene('mart'))
    }) : null;

    // survive-the-week meters (code lives in public/fun-center-week.js)
    const weekCtl = window.MiimiidMart && window.MiimiidMart.week ? window.MiimiidMart.week.create({
      S, content, week: session.week
    }) : null;

    // trick store scanner (code lives in public/fun-center-tricks.js)
    const trickCtl = window.MiimiidMart && window.MiimiidMart.tricks ? window.MiimiidMart.tricks.create({
      S, content, assistant, say, SFX, NO_OVERLAY, nearestProduct,
      request: miimiidFunCenterRequest,
      tricks: session.tricks || [],
      scansLeft: typeof session.scansLeft === 'number' ? session.scansLeft : 0,
      getScene: () => (game && game.scene.getScene('mart'))
    }) : null;

    // HUD: every top card (wallet, clock, sale, meters, list) moves onto the store as small pills
    const mwRoot = content.querySelector('.mw');
    const mwHud = document.createElement('div');
    mwHud.className = 'mw-hud';
    holder.appendChild(mwHud);
    const keepHud = () => {
      Array.from(mwRoot.children).forEach(ch => {
        if (ch === holder || ch.classList.contains('mw-controls')) return;
        mwHud.appendChild(ch);
      });
    };
    keepHud();
    new MutationObserver(keepHud).observe(mwRoot, { childList: true });
    // no emoji anywhere in the Mart: strip them from every label, button and message
    const EMOJI = /[\p{Extended_Pictographic}\u200D\uFE0F]/u;
    const EMOJI_ALL = /[\p{Extended_Pictographic}\u200D\uFE0F]/gu;
    const cleanText = n => {
      const v = n.nodeValue;
      if (!EMOJI.test(v)) return;
      n.nodeValue = v.replace(EMOJI_ALL, '').replace(/\s{2,}/g, ' ').trim();
    };
    const scrub = node => {
      if (node.nodeType === 3) { cleanText(node); return; }
      if (node.nodeType !== 1) return;
      const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      const list = [];
      while (w.nextNode()) list.push(w.currentNode);
      list.forEach(cleanText);
    };
    scrub(mwRoot);
    new MutationObserver(ms => {
      ms.forEach(m => {
        if (m.type === 'characterData') cleanText(m.target);
        else m.addedNodes.forEach(scrub);
      });
    }).observe(mwRoot, { childList: true, subtree: true, characterData: true });
    const listEl = content.querySelector('[data-mw-list]');
    const sit = session.week && session.week.situation;
    const listIds = sit ? sit.hints : NEED_IDS;
    const needItems = shop.items.filter(it => listIds.includes(it.id));
    listEl.innerHTML = sit
      ? `<details style="width:100%"><summary class="mw-list-title" style="cursor:pointer">${esc(sit.emoji)} ${esc(sit.title)} · tap for today's plan</summary>` +
        `<span style="display:block;font-size:13px;color:#e6e9f0;padding:4px 0">${esc(sit.story)} ${esc(sit.mission)}</span></details>` +
        needItems.map(it => `<span class="mw-chip" data-need="${esc(it.id)}">?</span>`).join('')
      : '<span class="mw-list-title">🛒 Shopping list</span>' +
        needItems.map(it => `<span class="mw-chip" data-need="${esc(it.id)}">${esc(it.name)}</span>`).join('');
    // instant rewards: sparkles, a rising chime, a combo and a streak bar for buying things on your list
    S.combo = 0;
    const comboEl = content.querySelector('[data-mw-combo]');
    function showCombo() {
      if (!comboEl) return;
      if (S.combo < 2) { comboEl.classList.remove('show'); return; }
      comboEl.textContent = `🔥 Smart streak x${S.combo}`;
      comboEl.classList.remove('show');
      void comboEl.offsetWidth;
      comboEl.classList.add('show');
    }
    function rewardFor(scene, item) {
      const onList = needItems.some(n => n.id === item.id);
      const px = scene.player.x;
      const py = scene.player.y - 120;
      if (scene.cartBox) {
        scene.tweens.add({ targets: scene.cartBox, scaleX: 1.1, scaleY: 1.1, duration: 90, yoyo: true });
      }
      if (onList) {
        S.combo += 1;
        scene.burst(px, py, 0x7ee2a8, 14);
        const notes = [523, 659, 784, 988, 1175];
        const n = Math.min(S.combo, notes.length) - 1;
        SFX.tone(notes[n], 0.12, 'triangle', 0.12);
        SFX.tone(notes[n] * 1.5, 0.2, 'triangle', 0.1, 0.08);
        const label = S.combo >= 3 ? `Smart buy x${S.combo}!` : (S.combo === 2 ? 'Smart buy x2!' : 'Smart buy!');
        scene.popText(px, py - 50, label, '#7ee2a8');
      } else {
        S.combo = 0;
        scene.burst(px, py, 0xffd34d, 6);
      }
      showCombo();
    }
    function hud() {
      walletEl.textContent = `$${S.budget - S.spent}`;
      countEl.textContent = String(S.basket.length);
      if (weekCtl) weekCtl.update();
      listEl.querySelectorAll('[data-need]').forEach(chip => {
        chip.classList.toggle('done', S.basket.includes(chip.dataset.need));
      });
    }
    function overlay(html) {
      const o = document.createElement('div');
      o.className = 'mw-overlay';
      o.innerHTML = `<div class="mw-card">${html}</div>`;
      holder.appendChild(o);
      return o;
    }

    content.querySelector('[data-mw-leave]').addEventListener('click', () => {
      destroyGame();
      renderMiimiidFunCenter();
    });

    // sound: browsers start audio only after a tap, so wake it on the first touch
    const muteBtn = content.querySelector('[data-mw-mute]');
    const ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    const ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6"/></svg>';
    muteBtn.innerHTML = SFX.muted ? ICON_OFF : ICON_ON;
    muteBtn.addEventListener('click', () => { muteBtn.innerHTML = SFX.toggleMute() ? ICON_OFF : ICON_ON; });
    content.addEventListener('pointerdown', () => { SFX.init(); SFX.startMusic(); });
    SFX.init();
    SFX.startMusic();

    // joystick
    const joyEl = content.querySelector('[data-mw-joy]');
    const knob = content.querySelector('[data-mw-knob]');
    const R = 36;
    const joyMove = e => {
      const r = joyEl.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const len = Math.hypot(dx, dy);
      const k = len > R ? R / len : 1;
      dx *= k; dy *= k;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      S.ctl.x = dx / R; S.ctl.y = dy / R;
    };
    const joyEnd = () => { S.ctl.x = 0; S.ctl.y = 0; knob.style.transform = ''; };
    joyEl.addEventListener('pointerdown', e => { joyEl.setPointerCapture(e.pointerId); joyMove(e); e.preventDefault(); });
    joyEl.addEventListener('pointermove', e => { if (joyEl.hasPointerCapture(e.pointerId)) joyMove(e); });
    joyEl.addEventListener('pointerup', joyEnd);
    joyEl.addEventListener('pointercancel', joyEnd);
    joyEl.addEventListener('lostpointercapture', joyEnd);

    // art for Phaser
    const cartArt = MIIMIID_ASSETS.characters.miimiidCart;
    const plain = MIIMIID_ASSETS.characters.miimiid;
    const fallbackPose = plain[(window.MIIMIID_FUN_POSES && MIIMIID_FUN_POSES.happy) || 'happy'];
    const frames = {
      idle: (cartArt && cartArt.idle) || fallbackPose,
      walk1: (cartArt && cartArt.walk1) || fallbackPose,
      walk2: (cartArt && cartArt.walk2) || fallbackPose
    };

    const items = shop.items.slice();
    const sources = {};
    items.forEach(item => { sources[item.id] = productSource(item); });

    const itemsByCat = {};
    items.forEach(item => {
      const cat = Object.keys(CATS).find(k => CATS[k].includes(item.id)) || 'fun';
      (itemsByCat[cat] = itemsByCat[cat] || []).push(item);
    });

    // ---- buying ----
    function pickOption(item) {
      return new Promise(resolve => {
        const remaining = S.budget - S.spent;
        const o = overlay(`
          <h3>${esc(item.name)}: same job, pick one</h3>
          ${item.options.map(opt => `
            <button type="button" class="mw-opt" data-opt="${esc(opt.id)}" ${opt.price > remaining ? 'disabled' : ''}>
              <span>${esc(opt.label)}</span><strong>$${opt.price}</strong>
            </button>`).join('')}
          <button type="button" class="mw-alt" data-opt-cancel>Never mind</button>
        `);
        o.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => { o.remove(); resolve(b.dataset.opt); }));
        o.querySelector('[data-opt-cancel]').addEventListener('click', () => { o.remove(); resolve(null); });
      });
    }

    async function buyProduct(scene, product) {
      if (S.busy) return;
      if (S.closed && S.basket.length > 0) { say('The store is closed! Head to the counter to pay.'); return; }
      if (rivalCtl && rivalCtl.isSoldOut(product.item.id)) { say(`${product.item.name} is sold out! Another shopper took the last one.`); return; }
      const item = product.item;
      S.busy = true;
      try {
        let optionId;
        if (hasOptions(item)) {
          optionId = await pickOption(item);
          if (!optionId) { say('No rush. Look around some more.'); return; }
        } else if (nowPrice(item) > S.budget - S.spent) {
          say(`${item.name} costs $${nowPrice(item)}, but you only have $${S.budget - S.spent} left.`);
          return;
        }

        scene.reachAt(product.x, product.y);
        SFX.reach();
        await new Promise(r => setTimeout(r, 240));

        const result = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/buy`,
          { method: 'POST', body: JSON.stringify({ itemId: item.id, optionId }), headers: NO_OVERLAY }
        );
        S.spent = result.spent;
        S.basket.push(item.id);
        if (rivalCtl) rivalCtl.onBought(item.id, result);
        product.taken = true;
        scene.flyToCart(product);
        scene.popText(scene.player.x, scene.player.y - 170, `-$${result.price}`, '#ffd34d');
        SFX.pickup();
        hud();
        rewardFor(scene, item);

        const left = result.remaining;
        const todo = needItems.filter(n => !S.basket.includes(n.id)).length;
        let text = `${item.name} is in the cart.`;
        if (todo === 0) text += ' Your list is complete! Head to the counter.';
        else text += ` ${todo} left on your list.`;
        if (left <= 5) text += ` Whoa, only $${left} left!`;
        else if (left <= 10) text += ` $${left} left.`;
        say(text);
        if (result.onSale) assistant.say(`Got it for $${result.price} instead of $${result.normalPrice}! A deal only saves you money if you needed the thing.`);
        else if (result.priceUp) assistant.say(`${item.name} cost $${result.price} instead of $${result.normalPrice}. Waiting made it more expensive.`);
        else assistant.react('grab', { price: result.price, left, count: S.basket.length });
      } catch (error) {
        console.error('world buy error:', error);
        say(error.message || 'That did not work. Try again.');
      } finally {
        S.busy = false;
      }
    }

    async function putBackProduct(scene, product) {
      if (S.busy) return;
      const item = product.item;
      S.busy = true;
      try {
        scene.reachAt(product.x, product.y);
        SFX.reach();
        await new Promise(r => setTimeout(r, 240));

        const result = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/unbuy`,
          { method: 'POST', body: JSON.stringify({ itemId: item.id }), headers: NO_OVERLAY }
        );
        S.spent = result.spent;
        S.basket = S.basket.filter(id => id !== item.id);
        scene.restoreToShelf(product);
        if (scene.refreshSale) scene.refreshSale();
        scene.popText(scene.player.x, scene.player.y - 170, `+$${result.price}`, '#7ee2a8');
        SFX.pickup();
        hud();
        say(`${item.name} is back on the shelf. $${result.remaining} left.`);
        assistant.react('putback');
      } catch (error) {
        console.error('world put back error:', error);
        say(error.message || 'That did not work. Try again.');
      } finally {
        S.busy = false;
      }
    }

    // cart shop: spend trip coins on cart skins
    async function openCartShop() {
      const o = overlay('<h3>Cart shop 🛒</h3><p>Loading…</p>');
      let last = null;
      const draw = (data, msg) => {
        last = data;
        const rows = data.skins.map(s => {
          const own = data.owned.includes(s.id);
          let action;
          if (data.equipped === s.id) action = '<strong>Equipped ✓</strong>';
          else if (own) action = `<button type="button" data-equip="${esc(s.id)}" style="width:auto;margin:0;padding:8px 14px">Use</button>`;
          else action = `<button type="button" data-buy="${esc(s.id)}" ${data.totalCoins < s.price ? 'disabled' : ''} style="width:auto;margin:0;padding:8px 14px">${s.price} coins</button>`;
          return `<div class="mw-opt" style="gap:10px;padding:6px 0"><span>${esc(s.label)}</span>${action}</div>`;
        }).join('');
        const plain = data.equipped
          ? '<button type="button" data-equip="" style="width:auto;margin:0;padding:8px 14px">Use</button>'
          : '<strong>Equipped ✓</strong>';
        const card = o.querySelector('.mw-card');
        card.innerHTML = `
          <h3>Cart shop 🛒</h3>
          <p>Your coins: <strong>${data.totalCoins}</strong></p>
          <div class="mw-opt" style="gap:10px;padding:6px 0"><span>Plain cart</span>${plain}</div>
          ${rows}
          ${msg ? `<p>${esc(msg)}</p>` : '<p><small>Your new cart shows up on your next trip.</small></p>'}
          <button type="button" class="mw-alt" data-shop-close>Close</button>
        `;
        card.querySelector('[data-shop-close]').addEventListener('click', () => o.remove());
        card.querySelectorAll('[data-buy]').forEach(b => b.addEventListener('click', () => act('buy', b.dataset.buy)));
        card.querySelectorAll('[data-equip]').forEach(b => b.addEventListener('click', () => act('equip', b.dataset.equip)));
      };
      const act = async (path, skinId) => {
        try {
          const data = await miimiidFunCenterRequest('/api/fun-center/cart-skins/' + path, {
            method: 'POST', body: JSON.stringify({ skinId }), headers: NO_OVERLAY
          });
          if (path === 'buy') SFX.coin();
          draw(data);
        } catch (error) {
          console.error('cart shop error:', error);
          draw(last, error.message || 'The cart shop did not work.');
        }
      };
      try {
        draw(await miimiidFunCenterRequest('/api/fun-center/cart-skins', { headers: NO_OVERLAY }));
      } catch (error) {
        console.error('cart shop load error:', error);
        o.querySelector('.mw-card').innerHTML = '<h3>Cart shop 🛒</h3><p>The cart shop is closed right now. Try again later.</p><button type="button" class="mw-alt" data-shop-close>Close</button>';
        o.querySelector('[data-shop-close]').addEventListener('click', () => o.remove());
      }
    }

    async function doCheckout(forced) {
      if (S.busy) return;
      if (S.basket.length === 0) { say('Pick something up first!'); return; }
      S.busy = true;
      try {
        const r = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/checkout`,
          { method: 'POST', body: JSON.stringify({}) }
        );
        const list = a => (Array.isArray(a) ? a : []);
        const row = (it, tag, note) => `
          <div style="display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid #232c42;font-size:13px;text-align:left">
            <span>${tag} ${esc(it.name)}${note ? `<br><small style="color:#9aa4bd">${esc(note)}</small>` : ''}</span>
            <strong>$${it.price}</strong>
          </div>`;
        const rows = [
          ...list(r.needsMissed).map(it => row(it, '❌ Missed', it.explanation || 'You still needed this.')),
          ...list(r.needsBought).map(it => row(it, '✅ Need', '')),
          ...list(r.wantsBought).map(it => row(it, '🛍️ Want', ''))
        ].join('');
        SFX.coin();
        if (SFX.stinger) SFX.stinger(r.burnedOut && r.burnedOut.length ? 'bad' : (r.stars >= 2 ? 'win' : 'ok'));
        const stat = (big, label) => `<div><div style="font-size:24px;font-weight:800;color:#e6e9f0">${big}</div><small style="color:#9aa4bd">${label}</small></div>`;
        const o = overlay(`
          <h3>${r.burnedOut && r.burnedOut.length ? 'You burned out' : 'Trip finished!'}</h3>
          ${window.MiimiidMart && window.MiimiidMart.week ? window.MiimiidMart.week.resultHtml(r) : ''}
          ${window.MiimiidMart && window.MiimiidMart.stars ? window.MiimiidMart.stars.html(r, (f, d, t, v, dl) => SFX.tone(f, d, t, v, dl)) : ''}
          <div style="display:flex;justify-content:space-around;gap:8px;margin:12px 0 6px">
            ${stat(`${list(r.needsBought).length}/${r.totalNeeds}`, 'Needs covered')}
            ${stat(`$${r.spent}`, 'Spent')}
            ${stat(`$${r.saved}`, 'Left')}
          </div>
          <p>+${Number.isFinite(r.xp) ? r.xp : 0} XP &middot; +${Number.isFinite(r.coins) ? r.coins : 0} coins 🪙</p>
          <div data-learn style="display:none;text-align:left">
            ${window.MiimiidMart && window.MiimiidMart.tricks ? window.MiimiidMart.tricks.resultHtml(r) : ''}
            ${forced ? '<p>⏰ Time ran out, so the cashier rang you up.</p>' : ''}
            <p>${esc(r.message || '')}</p>
            <div style="max-height:230px;overflow-y:auto;margin:6px 0">${rows}</div>
          </div>
          <button type="button" class="mw-alt" data-learnbtn>💡 What you learned</button>
          <button type="button" data-again>Shop again</button>
          <button type="button" class="mw-alt" data-cartshop>Spend your coins 🪙</button>
          <button type="button" class="mw-alt" data-back>Back to Fun Center</button>
        `);
        o.querySelector('[data-learnbtn]').addEventListener('click', e => {
          const learn = o.querySelector('[data-learn]');
          learn.style.display = 'block';
          e.currentTarget.remove();
          SFX.tone(660, 0.1, 'triangle', 0.1);
          learn.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        o.querySelector('[data-again]').addEventListener('click', () => { destroyGame(); startWorld(); });
        o.querySelector('[data-cartshop]').addEventListener('click', () => openCartShop());
        o.querySelector('[data-back]').addEventListener('click', () => { destroyGame(); renderMiimiidFunCenter(); });
      } catch (error) {
        console.error('world checkout error:', error);
        say(error.message || 'Checkout failed. Try again.');
        S.busy = false;
      }
    }

    grabBtn.addEventListener('click', () => {
      const scene = game && game.scene.getScene('mart');
      if (!scene || S.busy) return;
      const p = nearestProduct(scene);
      if (p && p.taken) putBackProduct(scene, p);
      else if (p) buyProduct(scene, p);
      else if (inCheckoutZone(scene)) scanThenCheckout();
      else say('Walk up to a shelf to grab something, or to the counter to pay.');
    });

    // ---- the store ----
    class MartScene extends Phaser.Scene {
      constructor() { super('mart'); }

      preload() {
        const barW = 400;
        const barX = (VIEW_W - barW) / 2;
        const barY = this.scale.height / 2;
        const barFrame = this.add.graphics();
        barFrame.lineStyle(3, 0x4da3ff, 1).strokeRoundedRect(barX - 4, barY - 4, barW + 8, 28, 8);
        const barFill = this.add.graphics();
        const barTitle = this.add.text(VIEW_W / 2, barY - 50, 'Opening Miimiid Mart…', {
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontSize: '28px', color: '#4da3ff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.load.on('progress', v => {
          barFill.clear();
          barFill.fillStyle(0x1f6feb, 1).fillRoundedRect(barX, barY, barW * v, 20, 6);
        });
        this.load.once('complete', () => { barFrame.destroy(); barFill.destroy(); barTitle.destroy(); });

        this.load.image('art-floor', ART + 'floor-1.png');
        this.load.image('art-shelf', ART + 'shelf.png');
        this.load.image('art-counter', ART + 'counter.png');
        MM_FILES.forEach(n => this.load.image('mm-' + n, ART + 'miimiid/' + n + '.png'));
        this.load.image('cart-left', ART + 'cart/cart-left.png');
        this.load.image('cart-right', ART + 'cart/cart-right.png');
        Object.keys(frames).forEach(k => this.load.image(`pl-${k}`, frames[k]));
        items.forEach(item => {
          const src = sources[item.id];
          if (src.src) this.load.image(`pr-${item.id}`, src.src);
        });
      }

      makeTextures() {
        if (this.textures.exists('floor')) return;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xe9dfcf, 1).fillRect(0, 0, 100, 100);
        g.fillStyle(0xe1d5c1, 1).fillRect(0, 0, 50, 50);
        g.fillRect(50, 50, 50, 50);
        g.lineStyle(2, 0xcbbda5, 1).strokeRect(0, 0, 100, 100);
        g.generateTexture('floor', 100, 100);
        g.destroy();
      }

      blocked(x, y) {
        return this.obst.some(o => x + 20 > o.x && x - 20 < o.x + o.w && y > o.y && y - 14 < o.y + o.h);
      }

      buildFridge(u, list) {
        const sy = u.y + UH;
        const DW = UW - 16;
        const DH = 82;
        const F = { u, state: 'closed', open: false, nextMist: 0, mist: 0 };
        this.fridges = this.fridges || [];
        this.fridges.push(F);

        // floor shadow and a cold glow that shows when the door is open
        this.add.ellipse(u.x + UW / 2, sy + 3, UW * 1.02, 26, 0x000000, 0.3).setDepth(sy - 1);
        F.glow = this.add.ellipse(u.x + UW / 2, sy + 32, UW * 1.1, 60, 0x9fe8ff, 0.5).setDepth(-97).setAlpha(0);

        // cabinet, header strip, lit interior, two shelves
        const g = this.add.graphics().setDepth(sy);
        g.fillStyle(0x0b1530, 1).fillRoundedRect(u.x, u.y, UW, UH, 8);
        g.fillStyle(0x1f6feb, 1).fillRoundedRect(u.x, u.y, UW, 30, { tl: 8, tr: 8, bl: 0, br: 0 });
        g.fillGradientStyle(0xe8fbff, 0xe8fbff, 0x8fdcf5, 0x8fdcf5, 1);
        g.fillRect(u.x + 8, u.y + 34, DW, DH);
        g.fillStyle(0xffffff, 0.9).fillRect(u.x + 8, u.y + 34, DW, 4);
        g.fillStyle(0xc9d6ea, 1).fillRect(u.x + 8, u.y + 72, DW, 5);
        g.fillStyle(0xc9d6ea, 1).fillRect(u.x + 8, u.y + 112, DW, 4);
        g.fillStyle(0x1a2b52, 1).fillRect(u.x, u.y + 118, UW, 22);
        g.fillStyle(0x3b5ca8, 1).fillRect(u.x, u.y + 118, UW, 3);

        // glass door: hinged on the left edge, so it swings open by squeezing sideways
        F.door = this.add.graphics({ x: u.x + 8, y: u.y + 34 }).setDepth(sy + 1.5);
        this.drawDoor(F, 0);

        this.add.text(u.x + UW / 2, u.y + 15, u.label, {
          fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(sy + 3);

        // you cannot walk into it
        this.obst.push({ x: u.x, y: u.y - 110, w: UW, h: UH + 110 });

        // products stand on the two shelves, alternating, so every price has its own spot
        const BOARDS = [u.y + 72, u.y + 112];
        list.forEach((item, i) => {
          const px = u.x + (UW / (list.length + 1)) * (i + 1);
          const baseY = BOARDS[i % 2];
          const src = sources[item.id];
          let obj;
          if (src.src) {
            obj = this.add.image(px, baseY, `pr-${item.id}`).setOrigin(0.5, 1);
            obj.setScale(36 / Math.max(obj.height, 1));
          } else {
            obj = this.add.text(px, baseY, src.emoji, { fontSize: '32px' }).setOrigin(0.5, 1);
          }
          obj.setDepth(sy + 1);
          const label = this.add.text(px, u.y + 125, priceText(item), {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
          }).setOrigin(0.5).setDepth(sy + 2);
          this.products.push({
            item, obj, label, x: px, y: baseY - 26, sy, taken: false, baseScale: obj.scaleX, fridge: F
          });
        });
      }

      drawDoor(F, t) {
        const DW = UW - 16;
        const DH = 82;
        const a = t * 1.4;                         // opens to about 80 degrees, swinging out toward you
        const s = Math.sin(a);
        const fx = DW * Math.cos(a);               // where the free edge of the door is
        const top = -DH * 0.07 * s;
        const bot = DH + DH * 0.22 * s;            // the free edge grows taller because it comes closer
        const g = F.door;
        g.clear();
        const pts = [{ x: 0, y: 0 }, { x: fx, y: top }, { x: fx, y: bot }, { x: 0, y: DH }];
        g.fillStyle(0x9fe3ff, 0.3 + 0.3 * s).fillPoints(pts, true);
        g.fillStyle(0xffffff, 0.22).fillTriangle(fx * 0.25, 0, fx * 0.65, top, 0, DH * 0.8);
        g.lineStyle(3, 0xe6f7ff, 0.95).strokePoints(pts, true);
        const hh = 36 * (1 + 0.22 * s);
        g.fillStyle(0xdfe7f5, 1).fillRoundedRect(fx - 12, (top + bot) / 2 - hh / 2, 6, hh, 3);
      }

      setFridge(F, open) {
        F.state = open ? 'opening' : 'closing';
        F.open = false;                                   // products cannot be grabbed while the door moves
        this.tweens.addCounter({
          from: open ? 0 : 1, to: open ? 1 : 0, duration: open ? 450 : 350, ease: 'Sine.easeInOut',
          onUpdate: tw => this.drawDoor(F, tw.getValue()),
          onComplete: () => { this.drawDoor(F, open ? 1 : 0); F.state = open ? 'open' : 'closed'; F.open = open; }
        });
        this.tweens.add({ targets: F.glow, alpha: open ? 0.45 : 0, duration: 350 });
        SFX.noise(open ? 0.22 : 0.12, 0.05, open ? 700 : 450);
              }

      updateFridges() {
        if (!this.fridges) return;
        const px = this.player.x;
        const py = this.player.y;
        const now = this.time.now;
        this.fridges.forEach(F => {
          const u = F.u;
          const near = px > u.x - 30 && px < u.x + UW + 30 && py >= u.y + UH + 4 && py < u.y + UH + 130;
          if (near && F.state === 'closed') this.setFridge(F, true);
          else if (!near && F.state === 'open') this.setFridge(F, false);
          // cold air sinks out of the open door (a few puffs at a time)
          if (F.state === 'open' && now > F.nextMist && F.mist < 8) {
            F.nextMist = now + 230;
            F.mist++;
            const m = this.add.circle(u.x + 20 + Math.random() * (UW - 40), u.y + 112, 5 + Math.random() * 4, 0xdff6ff, 0.5)
              .setDepth(u.y + UH + 3);
            this.tweens.add({
              targets: m, y: m.y + 46, scale: 2.2, alpha: 0, duration: 1100, ease: 'Sine.easeOut',
              onComplete: () => { m.destroy(); F.mist--; }
            });
          }
        });
      }

      // gives a shelf unit a visible top and side, so it reads as a box in three-quarter view
      addBoxFaces(u) {
        const VPX = W / 2;
        const VPY = 60;
        const K = 0.065;         // shallower than before (was 0.1)
        const back = p => ({ x: p.x + (VPX - p.x) * K, y: p.y + (VPY - p.y) * K });
        const tl = { x: u.x, y: u.y };
        const tr = { x: u.x + UW, y: u.y };
        const bl = { x: u.x, y: u.y + UH };
        const br = { x: u.x + UW, y: u.y + UH };
        const btl = back(tl);
        const btr = back(tr);
        const bbl = back(bl);
        const bbr = back(br);
        const g = this.add.graphics().setDepth(u.y + UH - 0.5);

        // side face (the side facing the middle of the store)
        const right = u.x + UW / 2 < VPX;
        const side = right ? [tr, br, bbr, btr] : [tl, bl, bbl, btl];
        g.fillStyle(0x0f2350, 1).fillPoints(side, true);
        g.lineStyle(2, 0x3b5ca8, 1).strokePoints(side, true);

        // top face: a blue-grey that matches the shelf, with a darker back edge
        const top = [tl, tr, btr, btl];
        g.fillStyle(0x9db9ea, 1).fillPoints(top, true);
        g.lineStyle(2, 0x5f86cf, 1).strokePoints(top, true);
        g.lineStyle(3, 0x3b5ca8, 1).lineBetween(btl.x, btl.y, btr.x, btr.y);
        g.lineStyle(2, 0xdbe8ff, 0.8).lineBetween(tl.x + 2, tl.y - 1, tr.x - 2, tr.y - 1);
      }

      buildUnit(u, list) {
        this.addBoxFaces(u);
        if (u.fridge) { this.buildFridge(u, list); return; }
        // soft shadow on the floor under the shelf, so it looks like it stands there
        this.add.ellipse(u.x + UW / 2, u.y + UH + 3, UW * 1.02, 26, 0x000000, 0.3)
          .setDepth(u.y + UH - 1);
        if (this.textures.exists('art-shelf')) {
          this.add.image(u.x, u.y, 'art-shelf').setOrigin(0, 0)
            .setDisplaySize(UW, UH).setDepth(u.y + UH);
        } else {
          const g = this.add.graphics().setDepth(u.y + UH);
          g.fillStyle(0x0b1530, 1).fillRect(u.x, u.y, UW, UH);
          g.fillStyle(0x1a2b52, 1).fillRect(u.x + 6, u.y + 34, UW - 12, 70);
          g.fillStyle(0xd7deec, 1).fillRect(u.x + 6, u.y + 100, UW - 12, 8);
          g.fillStyle(0x22386a, 1).fillRect(u.x, u.y + 108, UW, 32);
          g.fillStyle(0x3b5ca8, 1).fillRect(u.x, u.y + 108, UW, 4);
          g.fillStyle(0x1f6feb, 1).fillRect(u.x, u.y, UW, 30);
          g.fillStyle(0x050a18, 1).fillRect(u.x, u.y, 3, UH);
          g.fillRect(u.x + UW - 3, u.y, 3, UH);
        }
        this.add.text(u.x + UW / 2, u.y + 15, u.label, {
          fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(u.y + UH + 0.5);

        // the solid part of the shelf: you cannot walk into it
        this.obst.push({ x: u.x, y: u.y - 110, w: UW, h: UH + 110 });

        // products stand on the three cream boards, staggered so every item has its own spot
        const BOARDS = [u.y + 52, u.y + 82, u.y + 112];   // measured from shelf.png (tune by 2-4px if needed)
        list.forEach((item, i) => {
          const px = u.x + (UW / (list.length + 1)) * (i + 1);
          const baseY = BOARDS[i % 3];
          const src = sources[item.id];
          let obj;
          if (src.src) {
            obj = this.add.image(px, baseY, `pr-${item.id}`).setOrigin(0.5, 1);
            obj.setScale(32 / Math.max(obj.height, 1));
          } else {
            obj = this.add.text(px, baseY, src.emoji, { fontSize: '28px' }).setOrigin(0.5, 1);
          }
          obj.setDepth(u.y + UH + 1);
          const label = this.add.text(px, u.y + 125, priceText(item), {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
          }).setOrigin(0.5).setDepth(u.y + UH + 2);
          this.products.push({
            item, obj, label, x: px, y: baseY - 26, sy: u.y + UH, taken: false, baseScale: obj.scaleX
          });
        });
      }

      buildCounter() {
        const c = COUNTER;
        if (this.textures.exists('art-counter')) {
          const cart = this.add.image(c.x + c.w / 2, c.y + c.h + 4, 'art-counter').setOrigin(0.5, 1);
          cart.setScale(340 / Math.max(cart.width, 1)).setDepth(c.y + c.h);
        } else {
          const g = this.add.graphics().setDepth(c.y + c.h);
          g.fillStyle(0x23407a, 1).fillRect(c.x, c.y - 28, c.w, c.h + 28);
          g.fillStyle(0xdfe7f5, 1).fillRect(c.x - 6, c.y - 40, c.w + 12, 14);
          g.fillStyle(0x3b5ca8, 1).fillRect(c.x, c.y + c.h - 8, c.w, 8);
          g.fillStyle(0x0b1530, 1).fillRoundedRect(c.x + 40, c.y - 100, 90, 62, 6);
          g.fillStyle(0x4da3ff, 1).fillRect(c.x + 48, c.y - 92, 74, 30);
          g.fillStyle(0x0b1530, 1).fillRect(c.x + 60, c.y - 44, 50, 6);
          g.fillStyle(0x0b1530, 1).fillRoundedRect(c.x + 180, c.y - 52, 70, 12, 4);
          g.fillStyle(0xff4d4d, 1).fillRect(c.x + 190, c.y - 49, 50, 3);
          this.add.text(c.x + c.w / 2, c.y + 28, 'CHECKOUT', {
            fontSize: '20px', color: '#ffffff', fontStyle: 'bold'
          }).setOrigin(0.5).setDepth(c.y + c.h + 1);
        }
        this.obst.push({ x: c.x, y: c.y, w: c.w, h: c.h });

        const z = this.add.graphics().setDepth(-80);
        z.fillStyle(0x4da3ff, 0.14).fillRoundedRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h, 16);
        z.lineStyle(3, 0x4da3ff, 0.5).strokeRoundedRect(ZONE.x, ZONE.y, ZONE.w, ZONE.h, 16);
        this.add.text(ZONE.x + ZONE.w / 2, ZONE.y + ZONE.h / 2, 'PAY HERE', {
          fontSize: '22px', color: '#1f6feb', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(-79);
      }

      create() {
        this.products = [];
        this.obst = [];
        this.faceLeft = false;
        this.walkFlip = false;
        this.walkClock = 0;
        this.makeTextures();
        
        // every label in the store uses a clean font, drawn sharper
        const addText = this.add.text.bind(this.add);
        this.add.text = (x, y, t, style) => addText(x, y, t, Object.assign(
          { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', resolution: 2 }, style
        ));
        
        // soft shadows: every black floor shadow becomes a blurred one (no hard-edged ovals)
        if (!this.textures.exists('softshadow')) {
          const shTex = this.textures.createCanvas('softshadow', 128, 128);
          const shCtx = shTex.getContext();
          const shGrad = shCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
          shGrad.addColorStop(0, 'rgba(0,0,0,0.42)');
          shGrad.addColorStop(0.55, 'rgba(0,0,0,0.26)');
          shGrad.addColorStop(1, 'rgba(0,0,0,0)');
          shCtx.fillStyle = shGrad;
          shCtx.fillRect(0, 0, 128, 128);
          shTex.refresh();
        }
        const addEllipse = this.add.ellipse.bind(this.add);
        this.add.ellipse = (x, y, w, h, color, alpha) => (color === 0x000000
          ? this.add.image(x, y, 'softshadow').setDisplaySize(w * 1.15, h * 1.5)
          : addEllipse(x, y, w, h, color, alpha));

        // ---- ROOM (three-quarter): floor, back wall, two side walls, warm lighting ----
        const FL_TOP = WALL_H;
        const FL_BOT = H;
        const SIDE_BACK = 56;     // how far each side wall reaches in at the back wall
        const SIDE_FRONT = 14;    // and at the front of the store

        // floor: cool and darker at the back, bright and warm at the front (no checkerboard)
        const fl = this.add.graphics().setDepth(-100);
        fl.fillGradientStyle(0xb9ab93, 0xb9ab93, 0xf4ead6, 0xf4ead6, 1);
        fl.fillRect(0, FL_TOP, W, FL_BOT - FL_TOP);

        // faint tile joints that run toward the back wall, so the floor recedes
        const ROWS = 14;
        const COLS = 22;
        const COL_W = 130;
        const rowY = k => FL_TOP + (FL_BOT - FL_TOP) * Math.pow(k / ROWS, 1.45);
        const sc = y => 0.5 + 0.5 * ((y - FL_TOP) / (FL_BOT - FL_TOP));
        const fx = (c, y) => W / 2 + (c - COLS / 2) * COL_W * sc(y);
        fl.lineStyle(2, 0x9c8b6c, 0.2);
        for (let r = 1; r <= ROWS; r++) fl.lineBetween(0, rowY(r), W, rowY(r));
        for (let c = 0; c <= COLS; c++) fl.lineBetween(fx(c, FL_TOP), FL_TOP, fx(c, FL_BOT), FL_BOT);

        // soft light sheen across the floor
        fl.fillStyle(0xffffff, 0.07);
        fl.fillPoints([{ x: 180, y: FL_TOP + 60 }, { x: 420, y: FL_TOP + 60 }, { x: 260, y: FL_BOT }, { x: -40, y: FL_BOT }], true);
        fl.fillPoints([{ x: 820, y: FL_TOP + 60 }, { x: 1020, y: FL_TOP + 60 }, { x: 1160, y: FL_BOT }, { x: 900, y: FL_BOT }], true);

        // shadow where the floor meets the back wall
        const floorShade = this.add.graphics().setDepth(-99);
        floorShade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.45, 0.45, 0, 0);
        floorShade.fillRect(0, WALL_H, W, 110);

        // warm pools of light: soft glow with no hard edges
        if (!this.textures.exists('glow')) {
          const gc = this.textures.createCanvas('glow', 256, 256);
          const ctx = gc.getContext();
          const gr = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
          gr.addColorStop(0, 'rgba(255,238,190,0.55)');
          gr.addColorStop(0.45, 'rgba(255,238,190,0.2)');
          gr.addColorStop(1, 'rgba(255,238,190,0)');
          ctx.fillStyle = gr;
          ctx.fillRect(0, 0, 256, 256);
          gc.refresh();
        }
        [[330, 470], [760, 470], [1100, 470], [330, 830], [760, 860], [1100, 860]].forEach((p, i) => {
          const gl = this.add.image(p[0], p[1], 'glow').setDisplaySize(560, 200).setDepth(-98).setAlpha(0.65);
          this.tweens.add({ targets: gl, alpha: 0.42, duration: 2600 + i * 450, delay: i * 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        });
        // dust floating in the lamp light
        for (let i = 0; i < 18; i++) {
          const mote = this.add.circle(120 + Math.random() * 1160, 260 + Math.random() * 640, 1.5 + Math.random() * 1.5, 0xfff2c9, 0.4).setDepth(-96);
          this.tweens.add({
            targets: mote, y: mote.y - (40 + Math.random() * 60), x: mote.x + (Math.random() - 0.5) * 60, alpha: 0.05,
            duration: 5000 + Math.random() * 4000, delay: Math.random() * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
          });
        }

        // the edges of the floor fall into shadow
        const edge = this.add.graphics().setDepth(-97);
        edge.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0, 0.35, 0);
        edge.fillRect(0, WALL_H, 150, H - WALL_H);
        edge.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.35, 0, 0.35);
        edge.fillRect(W - 150, WALL_H, 150, H - WALL_H);

        // back wall: panels, ceiling strip with lamps, bright trim
        const wall = this.add.graphics().setDepth(-90);
        wall.fillGradientStyle(0x1d3d78, 0x1d3d78, 0x0e1a38, 0x0e1a38, 1, 1, 1, 1);
        wall.fillRect(0, 0, W, WALL_H);
        wall.lineStyle(2, 0xffffff, 0.08);
        for (let x = 140; x < W; x += 140) wall.lineBetween(x, 22, x, WALL_H - 14);
        wall.fillStyle(0x0b1530, 1).fillRect(0, 0, W, 22);
        for (let x = 130; x < W; x += 220) {
          wall.fillStyle(0xfff6d8, 0.16).fillEllipse(x, 44, 200, 46);
          wall.fillStyle(0xffffff, 1).fillRoundedRect(x - 55, 8, 110, 8, 4);
        }
        wall.fillStyle(0x1f6feb, 1).fillRect(0, WALL_H - 14, W, 14);
        wall.fillStyle(0x7ab8ff, 1).fillRect(0, WALL_H - 14, W, 3);

        // side walls: slanted toward the back so the room has real corners
        const sw = this.add.graphics().setDepth(-89);
        sw.fillStyle(0x17305e, 1);
        sw.fillPoints([{ x: 0, y: 0 }, { x: SIDE_BACK, y: 22 }, { x: SIDE_BACK, y: WALL_H }, { x: SIDE_FRONT, y: H }, { x: 0, y: H }], true);
        sw.fillStyle(0x112347, 1);
        sw.fillPoints([{ x: W, y: 0 }, { x: W - SIDE_BACK, y: 22 }, { x: W - SIDE_BACK, y: WALL_H }, { x: W - SIDE_FRONT, y: H }, { x: W, y: H }], true);
        // dark line in each back corner
        sw.lineStyle(3, 0x050a18, 0.7);
        sw.lineBetween(SIDE_BACK, 22, SIDE_BACK, WALL_H);
        sw.lineBetween(W - SIDE_BACK, 22, W - SIDE_BACK, WALL_H);
        // wall rail
        sw.lineStyle(3, 0x7ab8ff, 0.35);
        sw.lineBetween(0, H - 120, SIDE_BACK, WALL_H - 60);
        sw.lineBetween(W, H - 120, W - SIDE_BACK, WALL_H - 60);
        // baseboards along the floor
        sw.lineStyle(10, 0x1f6feb, 1);
        sw.lineBetween(SIDE_BACK, WALL_H, SIDE_FRONT, H);
        sw.lineBetween(W - SIDE_BACK, WALL_H, W - SIDE_FRONT, H);
        sw.lineStyle(3, 0x7ab8ff, 1);
        sw.lineBetween(SIDE_BACK + 5, WALL_H, SIDE_FRONT + 5, H);
        sw.lineBetween(W - SIDE_BACK - 5, WALL_H, W - SIDE_FRONT - 5, H);
        wall.fillStyle(0x0b1530, 1).fillRect(-200, -260, W + 400, 260);   // ceiling, so the camera can scroll up past the sign
        // posters with money tips, so the back wall is not empty (the big sign sits in the middle)
        const posters = [
          [150, 'NEEDS FIRST', 0x1f6feb], [290, 'WATCH THE TOTAL', 0x2f9e6b], [430, 'COMPARE PRICES', 0xe8772e],
          [980, 'SALE IS NOT A NEED', 0xe0245e], [1120, 'PLAN YOUR LIST', 0x1f6feb], [1260, 'SAVE A LITTLE', 0x7a4de0]
        ];
        const pg = this.add.graphics().setDepth(-86);
        posters.forEach(p => {
          pg.fillStyle(0x000000, 0.3).fillRoundedRect(p[0] - 52, 66, 108, 88, 6);
          pg.fillStyle(0xf4f8ff, 1).fillRoundedRect(p[0] - 55, 62, 110, 88, 6);
          pg.fillStyle(p[2], 1).fillRoundedRect(p[0] - 55, 62, 110, 26, { tl: 6, tr: 6, bl: 0, br: 0 });
          pg.fillStyle(p[2], 0.25).fillRect(p[0] - 42, 100, 84, 8).fillRect(p[0] - 42, 116, 60, 8).fillRect(p[0] - 42, 132, 72, 8);
          this.add.text(p[0], 75, p[1], {
            fontSize: '11px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 98 }
          }).setOrigin(0.5).setDepth(-85);
        });

        // ---- WELCOME SIGN: letter-by-letter neon heading + tagline (replaces the old static sign) ----
        const SIGN_X = W / 2;
        const plate = this.add.graphics().setDepth(-82);
        plate.fillStyle(0x050b1f, 0.94).fillRoundedRect(SIGN_X - 210, 34, 420, 130, 16);
        plate.lineStyle(3, 0x00e5ff, 0.85).strokeRoundedRect(SIGN_X - 210, 34, 420, 130, 16);
        plate.lineStyle(1, 0xffffff, 0.45).strokeRoundedRect(SIGN_X - 206, 38, 412, 122, 13);
        const halo = this.add.image(SIGN_X, 99, 'glow').setDisplaySize(560, 190)
          .setTint(0x00cfff).setBlendMode(Phaser.BlendModes.ADD).setDepth(-83).setAlpha(0);
        const lit = { v: 0 };
        const pulse = { p: 0 };

        // one text object per letter, centered on the line; spaces only add a gap
        const buildLine = (str, cy, size, startWord) => {
          const out = [];
          const gap = size * 0.38;
          const track = 3;
          let total = 0;
          const parts = str.split('').map(ch => {
            if (ch === ' ') { total += gap; return { sp: true }; }
            const t = this.add.text(0, cy, ch, {
              fontSize: size + 'px', color: '#27d3ff', fontStyle: 'bold',
              stroke: '#ffffff', strokeThickness: 2
            }).setOrigin(0.5).setDepth(-79).setAlpha(0);
            t.setShadow(0, 0, '#00e5ff', 12, true, true);
            total += t.width + track;
            return { t };
          });
          let x = SIGN_X - total / 2;
          let word = startWord;
          parts.forEach(p => {
            if (p.sp) { x += gap; word++; return; }
            x += p.t.width / 2;
            p.t.x = x;
            x += p.t.width / 2 + track;
            out.push({ t: p.t, y: cy, word });
          });
          return out;
        };
        // reading order: WELCOME, TO, MIIMIID, MART
        const letters = buildLine('WELCOME TO', 66, 28, 0).concat(buildLine('MIIMIID MART', 106, 40, 2));
        const tag = this.add.text(SIGN_X, 146, 'Smart choice. Brighter tomorrow.', {
          fontSize: '16px', color: '#bfefff'
        }).setOrigin(0.5).setDepth(-79).setAlpha(0);
        tag.setShadow(0, 0, '#00e5ff', 8, false, true);
        const sweep = this.add.image(SIGN_X, 99, 'glow').setDisplaySize(70, 120)
          .setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(-78).setAlpha(0);
        const spark = this.add.image(SIGN_X, 99, 'glow').setScale(0.1)
          .setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(-78).setAlpha(0);

        // soft pulse of the neon halo (only visible while the sign is lit)
        this.tweens.add({
          targets: pulse, p: 1, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          onUpdate: () => halo.setAlpha(lit.v * (0.3 + 0.25 * pulse.p))
        });

        const runSign = () => {
          const n = letters.length;
          // fade in, letter by letter, left to right
          letters.forEach((L, i) => {
            L.t.setAlpha(0).setY(L.y + 8);
            this.tweens.add({ targets: L.t, alpha: 1, y: L.y, duration: 380, delay: i * 85 + L.word * 120, ease: 'Sine.easeOut' });
          });
          const tIn = n * 85 + 3 * 120 + 400;
          this.tweens.add({ targets: lit, v: 1, duration: 900, delay: 400 });
          this.tweens.add({ targets: tag, alpha: 1, duration: 600, delay: tIn });
          // light sweep and sparkles while everything is showing
          this.time.delayedCall(tIn + 600, () => {
            sweep.setPosition(SIGN_X - 190, 99).setAlpha(0.7);
            this.tweens.add({ targets: sweep, x: SIGN_X + 190, duration: 1000, ease: 'Sine.easeInOut', onComplete: () => sweep.setAlpha(0) });
          });
          [0, 1, 2].forEach(k => this.time.delayedCall(tIn + 700 + k * 500, () => {
            const L = letters[Math.floor(Math.random() * n)];
            spark.setPosition(L.t.x, L.y - 6);
            this.tweens.add({ targets: spark, alpha: { from: 0, to: 1 }, scale: { from: 0.1, to: 0.28 }, duration: 260, yoyo: true });
          }));
          // fade out: tagline first, then letters right to left
          const tOut = tIn + 600 + 2600;
          this.tweens.add({ targets: tag, alpha: 0, duration: 500, delay: tOut });
          letters.forEach((L, i) => {
            this.tweens.add({ targets: L.t, alpha: 0, duration: 300, delay: tOut + 500 + (n - 1 - i) * 55 });
          });
          this.tweens.add({ targets: lit, v: 0, duration: 700, delay: tOut + 500 });
          // short pause, then the next cycle
          this.time.delayedCall(tOut + 500 + n * 55 + 300 + 900, runSign);
        };
        runSign();

        // entrance mat
        const mat = this.add.graphics().setDepth(-95);
        mat.fillStyle(0x0d1730, 1).fillRoundedRect(60, 880, 260, 90, 12);
        mat.lineStyle(3, 0x4da3ff, 1).strokeRoundedRect(60, 880, 260, 90, 12);
        this.add.text(190, 925, 'WELCOME', { fontSize: '22px', color: '#4da3ff', fontStyle: 'bold' })
          .setOrigin(0.5).setDepth(-94);

        // shelves, products and the counter
        UNITS.forEach(u => this.buildUnit(u, itemsByCat[u.id] || []));
        this.buildCounter();
        this.buildShopkeeper();
        this.buildCashier();
        this.buildCustomer();
        this.buildCrowd();

        // player
        this.shadow = this.add.ellipse(START.x, START.y - 2, 110, 24, 0x000000, 0.28);
        this.reachUntil = 0;
        this.reachT0 = 0;
        this.reachSide = 'L';
        this.puppet = null;
        try { this.puppet = this.buildPuppet(START.x, START.y); } catch (e) { console.error('puppet failed:', e); }
        if (this.puppet) {
          this.player = this.puppet.root;
        } else {
          this.player = this.add.image(START.x, START.y, 'pl-idle').setOrigin(0.5, 1);
          this.player.setScale(130 / Math.max(this.player.height, 1));
        }

        this.cartBox = null;
        this.cartSide = 1;
        if (this.puppet && this.textures.exists('cart-left') && this.textures.exists('cart-right')) {
          this.cartBox = this.add.container(START.x + CART_GAP, START.y);
          this.cartImg = this.add.image(0, 0, 'cart-right').setOrigin(0.5, 1);
          this.cartImg.setScale(CART_W / this.cartImg.width);
          this.cartBox.add(this.cartImg);
          if (session.cartSkin && session.cartSkin.color) this.cartImg.setTint(session.cartSkin.color);
        }

        this.arm = this.add.graphics().setDepth(99999);
        this.grip = this.add.graphics();

        // camera
        const cam = this.cameras.main;
        cam.setBounds(0, -230, W, H + 230);
        cam.setZoom(Math.max(1.2, this.scale.height / H));
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(90, 60);
        cam.roundPixels = true;

        this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
      }

      buildPuppet(x, y) {
        if (!MM_FILES.every(n => this.textures.exists('mm-' + n))) return null;
        const root = this.add.container(x, y).setScale(MM_SCALE);
        const P = { root, view: 'front', phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0, views: {} };
        Object.keys(MM_VIEWS).forEach(name => {
          const D = MM_VIEWS[name];
          const c = D.c;
          const box = this.add.container(0, 0);
          const upper = this.add.container(0, 0);
          const V = { box, upper, arms: null };
          const put = (parent, key, ux, uy, sc, px, py) => {
            const im = this.add.image(ux + px - c[0], uy + py - c[1], 'mm-' + key).setScale(sc);
            im.setOrigin(px / (im.width * sc), py / (im.height * sc));
            im.baseY = im.y;
            parent.add(im);
            return im;
          };
          V.legL = put(box, D.legL[0], D.legL[1], D.legL[2], 1, D.legL[3], D.legL[4]);
          V.legR = put(box, D.legR[0], D.legR[1], D.legR[2], 1, D.legR[3], D.legR[4]);
          box.add(upper);
          put(upper, D.torso[0], D.torso[1], D.torso[2], 1, 0, 0);
          if (D.shoulder) {
            V.arms = { L: {}, R: {} };
            ['L', 'R'].forEach(sd => {
              Object.keys(MM_ARMS[sd]).forEach(pose => {
                if (pose === 'hang' && !D.hang) return;
                const a = MM_ARMS[sd][pose];
                const im = this.add.image(D.shoulder[sd][0] - c[0], D.shoulder[sd][1] - c[1], 'mm-' + a[0])
                  .setScale(0.7).setOrigin(a[1], a[2]).setVisible(pose === 'hang');
                upper.add(im);
                V.arms[sd][pose] = im;
              });
            });
          }
          put(upper, D.head[0], D.head[1], D.head[2], D.head[3], 0, 0);
          if (D.face) {
            const F = D.face;
            const hx = D.head[1];
            const hy = D.head[2];
            const fp = (key, p) => {
              const im = this.add.image(hx + p[0] - c[0], hy + p[1] - c[1], 'mm-' + key).setScale(0.44);
              upper.add(im);
              return im;
            };
            V.eyeO = [fp('eye-open-left', F.eyeL), fp('eye-open-right', F.eyeR)];
            V.eyeC = [fp('eye-closed-left', F.eyeL), fp('eye-closed-right', F.eyeR)];
            V.mouth = { s: fp('mouth-smile', F.mouth), m: fp('mouth-open-medium', F.mouth), b: fp('mouth-open-big', F.mouth) };
            V.eyeC.forEach(e => e.setVisible(false));
            V.mouth.m.setVisible(false);
            V.mouth.b.setVisible(false);
          }
          box.setVisible(name === 'front');
          root.add(box);
          P.views[name] = V;
        });
        return P;
      }

      animPuppet(delta, now, moving, ix, iy) {
        const P = this.puppet;
        const reaching = now < this.reachUntil;
        let view = P.view;
        if (reaching) view = 'back';                       // he faces the shelf
        else if (moving) view = Math.abs(iy) > Math.abs(ix) * 1.1 ? (iy > 0 ? 'front' : 'back') : 'side';
        if (view !== P.view) {
          P.view = view;
          Object.keys(P.views).forEach(k => P.views[k].box.setVisible(k === view));
        }
        P.root.scaleX = (view === 'side' && this.faceLeft) ? -MM_SCALE : MM_SCALE;
        const V = P.views[view];
        P.amp += ((moving ? 1 : 0) - P.amp) * Math.min(1, delta / 90);
        if (moving) P.phase += (delta / 1000) * (Math.PI * 2 / 0.7);
        const s = Math.sin(P.phase);
        const c = Math.cos(P.phase);
        const a = P.amp;
        const rad = Phaser.Math.DegToRad;
        const sw = view === 'side' ? 26 : 20;
        V.legL.setRotation(rad(sw * s * a));
        V.legR.setRotation(rad(-sw * s * a));
        V.legL.y = V.legL.baseY - 12 * Math.max(0, c) * a;
        V.legR.y = V.legR.baseY - 12 * Math.max(0, -c) * a;
        V.upper.y = -5 * Math.abs(s) * a;

        if (V.arms) {
          ['L', 'R'].forEach(sd => {
            const A = V.arms[sd];
            const sg = sd === 'L' ? 1 : -1;
            let pose = 'hang';
            let rot = (sd === 'L' ? -10 : 10) * s * a;
            if (reaching && sd === this.reachSide) {
              const p = (now - this.reachT0) / 900;
              if (p < 0.55) {
                const e = Math.min(p / 0.35, 1);
                const k = e < 0.5 ? 2 * e * e : 1 - Math.pow(-2 * e + 2, 2) / 2;
                pose = 'reach';
                rot = sg * (-6 + 76 * k);
              } else if (p < 0.8) {
                pose = 'fist';
                rot = 0;
              }
            }
            ['hang', 'reach', 'fist'].forEach(n => {
              if (A[n]) A[n].setVisible(n === pose).setRotation(n === pose ? rad(rot) : 0);
            });
          });
        }

        if (V.eyeO) {
          if (now > P.nextBlink) { P.blinkUntil = now + 130; P.nextBlink = now + 2200 + Math.random() * 3200; }
          const shut = now < P.blinkUntil;
          V.eyeO.forEach(e => e.setVisible(!shut));
          V.eyeC.forEach(e => e.setVisible(shut));
          const m = reaching ? 'm' : 's';
          ['s', 'm', 'b'].forEach(k => V.mouth[k].setVisible(k === m));
        }
      }

      reachAt(tx, ty) {
        this.reachSide = tx < this.player.x ? 'L' : 'R';
        this.reachT0 = this.time.now;
        this.reachUntil = this.reachT0 + 900;
        if (this.puppet) return;                            // the puppet reaches with real arms
        const dir = this.faceLeft ? -1 : 1;
        const sx = this.player.x + dir * 40;
        const sy = this.player.y - 70;
        this.arm.clear();
        this.arm.lineStyle(9, 0xf1b27a, 1).lineBetween(sx, sy, tx, ty);
        this.arm.fillStyle(0xf1b27a, 1).fillCircle(tx, ty, 11);
        this.time.delayedCall(300, () => this.arm.clear());
      }

      flyToCart(product) {
        if (product.label) product.label.destroy();
        const flying = product.obj;               // this copy is carried by hand; a new one is made if put back
        flying.setDepth(this.player.y + 3);
        const box = this.cartBox;
        const handX = this.player.x + (this.reachSide === 'L' ? -28 : 28);
        const handY = this.player.y - 96;
        // 1) the hand takes it off the shelf
        this.tweens.add({
          targets: flying,
          x: handX,
          y: handY,
          scale: product.baseScale * 0.85,
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            if (!box) { flying.destroy(); return; }
            // 2) carry it over the cart
            const lx = (this.cartSide * 0.11 + (Math.random() - 0.5) * 0.28) * CART_W;
            const ly = -CART_W * 0.76 * (0.46 + Math.random() * 0.08);
            this.tweens.add({
              targets: flying,
              x: box.x + lx,
              y: box.y + ly - 46,
              scale: product.baseScale * 0.7,
              duration: 260,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                // 3) drop it in
                this.tweens.add({
                  targets: flying,
                  x: box.x + lx,
                  y: box.y + ly,
                  duration: 180,
                  ease: 'Bounce.easeOut',
                  onComplete: () => {
                    flying.destroy();
                    if (!product.taken) return;           // it was put back while flying
                    const src = sources[product.item.id];
                    const keep = src.src
                      ? this.add.image(lx, ly, 'pr-' + product.item.id).setOrigin(0.5, 1)
                      : this.add.text(lx, ly, src.emoji, { fontSize: '30px' }).setOrigin(0.5, 1);
                    if (src.src) keep.setScale((CART_W * 0.26) / Math.max(keep.height, 1));
                    box.addAt(keep, 0);               // goes in behind the cart front, so the mesh shows it
                    product.keep = keep;
                  }
                });
              }
            });
          }
        });
      }

      buildShopkeeper() {
        const start = ASSISTANT_PATH[0];
        this.sk = {
          x: start[0], y: start[1], wp: 1, wait: 1500, phase: 0, amp: 0,
          talkUntil: 0, waveUntil: 0, nextBlink: 0, blinkUntil: 0
        };
        const sk = this.sk;
        this.skShadow = this.add.ellipse(sk.x, sk.y - 2, 70, 16, 0x000000, 0.25);
        this.skObst = { x: sk.x - 24, y: sk.y - 8, w: 48, h: 16 };
        this.obst.push(this.skObst);
        this.skp = this.makeNpc({
          x: sk.x, y: sk.y, shirt: 0x2f9e6b, pants: 0x23407a, hair: 0x3a2a1e, skin: 0xf1b27a,
          cap: 0x2f9e6b, capDark: 0x237a52, apron: true, tag: 'STAFF'
        });
      }

      shopkeeperTalk() {
        if (!this.sk) return;
        this.sk.talkUntil = this.time.now + 3800;
        // a little speech bubble drawn in code
        const g = this.add.graphics().setDepth(100001);
        g.fillStyle(0xffffff, 1).fillRoundedRect(-17, -13, 34, 24, 8).fillTriangle(-4, 10, 4, 10, 0, 17);
        g.fillStyle(0x2f9e6b, 1).fillCircle(-8, -1, 2.6).fillCircle(0, -1, 2.6).fillCircle(8, -1, 2.6);
        g.setPosition(this.sk.x, this.sk.y - 190);
        this.tweens.add({ targets: g, y: g.y - 26, alpha: 0, duration: 1300, ease: 'Sine.easeOut', onComplete: () => g.destroy() });
      }

      updateShopkeeper(delta) {
        const sk = this.sk;
        const P = this.skp;
        if (!sk || !P) return;
        const now = this.time.now;
        const dt = delta / 1000;
        const dp = Math.hypot(this.player.x - sk.x, this.player.y - sk.y);

        if (!assistant.greeted && dp < 260) {
          assistant.greeted = true;
          sk.waveUntil = now + 2200;
          assistant.react('greet');
        }
        const talking = now < sk.talkUntil;
        const waving = now < sk.waveUntil;
        let moving = false;
        let look = 0;

        if (talking || waving || dp < 95) {
          look = Math.sign(this.player.x - sk.x);       // stops and turns to face you
        } else if (sk.wait > 0) {
          sk.wait -= delta;
        } else {
          const t = ASSISTANT_PATH[sk.wp];
          const dx = t[0] - sk.x;
          const dy = t[1] - sk.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 5) {
            sk.wp = (sk.wp + 1) % ASSISTANT_PATH.length;
            sk.wait = Math.random() < 0.45 ? 1200 + Math.random() * 2200 : 0;
          } else {
            const step = Math.min(dist, ASSISTANT_SPEED * dt);
            sk.x += (dx / dist) * step;
            sk.y += (dy / dist) * step;
            moving = true;
            look = Math.sign(dx);
          }
        }

        P.root.setPosition(sk.x, sk.y).setDepth(sk.y);
        this.skShadow.setPosition(sk.x, sk.y - 2).setDepth(sk.y - 1);
        this.skObst.x = sk.x - 24;
        this.skObst.y = sk.y - 8;
        sk.face = (dp < 95 && !talking && !waving) ? 'front' : null;
        this.animNpc(P, sk, now, delta, moving, look, talking, waving);
      }

      refreshSale() {
        const sale = saleNow.cur;
        this.products.forEach(p => {
          const on = !!sale && sale.itemId === p.item.id && !p.taken && Date.now() < sale.endsAt;
          const up = !!hikeNow.cur && hikeNow.cur.itemId === p.item.id && !p.taken;
          if (p.label && p.label.active) {
            p.label.setText(priceText(p.item));
            p.label.setColor(on ? '#ffd34d' : (up ? '#ff6b6b' : '#ffffff'));
          }
          if (on && !p.badge) {
            p.badge = this.add.text(p.x, p.sy - 96, sale.label, {
              fontSize: '13px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#e0245e', padding: { x: 6, y: 2 }
            }).setOrigin(0.5, 1).setDepth(p.sy + 3);
            this.tweens.add({ targets: p.badge, scale: 1.18, duration: 450, yoyo: true, repeat: -1 });
          } else if (!on && p.badge) {
            this.tweens.killTweensOf(p.badge);
            p.badge.destroy();
            p.badge = null;
    }
  });
  this.refreshHot();
}

refreshHot() {
  this.products.forEach(p => {
    if (p.taken && p.hotBadge) {
      this.tweens.killTweensOf(p.hotBadge);
      p.hotBadge.destroy();
      p.hotBadge = null;
      return;
    }
    if (!p.item || !p.item.hot || p.taken || p.hotBadge) return;
    p.hotBadge = this.add.text(p.x, p.sy - 120, p.item.hot.tag, {
      fontSize: '11px', color: '#ffffff', backgroundColor: '#e8590c',
      padding: { x: 4, y: 2 }, fontStyle: 'bold'
    }).setOrigin(0.5, 1).setDepth(p.sy + 3);
    this.tweens.add({ targets: p.hotBadge, scale: 1.12, duration: 600, yoyo: true, repeat: -1 });
  });
}

      // A person with a jointed body. Thighs and shins bend at the knee, arms bend at the elbow,
      // and there are front, back and side views. Sam, Alex, Riley, Jordan and the customers all use it.
      makeNpc(o) {
        const skin = o.skin || 0xf1b27a;
        const skinD = 0xd9965f;
        const hairC = o.hair || 0x1d1d1d;
        const shoeC = o.shoes || 0x1a2038;
        const ink = 0x141824;
        const part = (x, y) => this.add.container(x, y);
        const root = this.add.container(o.x, o.y);
        const N = {
          root, view: 'front', pend: '', pendT: 0, dir: 1, hx: 0, hy: 1, px: undefined, py: undefined,
          legs: {}, arms: {}, bob: Math.random() * 6,
          idleAt: (this.time ? this.time.now : 0) + 2500 + Math.random() * 6000, idleUntil: 0, idleKind: ''
        };

        // legs: a thigh, then a shin that bends at the knee, then the shoe
        ['L', 'R'].forEach(sd => {
          const leg = part(sd === 'L' ? -10 : 10, -46);
          const th = this.add.graphics();
          th.fillStyle(o.pants, 1).fillRoundedRect(-7.5, -2, 15, 26, 6);
          const shin = part(0, 22);
          const sg = this.add.graphics();
          sg.fillStyle(o.pants, 1).fillRoundedRect(-6.5, -2, 13, 22, 5);
          const foot = part(0, 19);
          const shoeFB = this.add.graphics();
          shoeFB.fillStyle(shoeC, 1).fillRoundedRect(-9, -4, 18, 9, 4);
          shoeFB.fillStyle(0xffffff, 1).fillRoundedRect(-9, 2, 18, 3, 1.5);
          const shoeS = this.add.graphics();
          shoeS.fillStyle(shoeC, 1).fillRoundedRect(-7, -4, 22, 9, 4);
          shoeS.fillStyle(0xffffff, 1).fillRoundedRect(-7, 2, 22, 3, 1.5);
          foot.add([shoeFB, shoeS]);
          shin.add([sg, foot]);
          leg.add([th, shin]);
          N.legs[sd] = { leg, shin, foot, shoeFB, shoeS };
        });

        // body, arms and head
        const upper = part(0, 0);
        const torso = this.add.graphics();
        const neck = this.add.graphics();
        neck.fillStyle(skin, 1).fillRoundedRect(-6, -114, 12, 12, 3);
        N.tagTxt = o.tag ? this.add.text(0, -75.5, o.tag, { fontSize: '8px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5) : null;
        N.drawBody = view => {
          const w = view === 'side' ? 30 : 46;
          torso.clear();
          torso.fillStyle(o.shirt, 1).fillRoundedRect(-w / 2, -106, w, 64, 12);
          torso.fillStyle(0x0b1530, 0.55).fillRect(-w / 2, -49, w, 5);
          if (view === 'front') {
            if (o.apron) {
              torso.fillStyle(0xffffff, 1).fillRoundedRect(-15, -86, 30, 40, 7);
              torso.fillStyle(o.shirt, 1).fillRoundedRect(-9, -80, 18, 9, 3);
            } else {
              torso.fillStyle(0xffffff, 0.9).fillRoundedRect(-8, -92, 16, 16, 4);
            }
          } else if (view === 'side' && o.apron) {
            torso.fillStyle(0xffffff, 1).fillRoundedRect(3, -86, 11, 40, 5);
          }
        };
        ['L', 'R'].forEach(sd => {
          const arm = part(sd === 'L' ? -26 : 26, -98);
          const ua = this.add.graphics();
          ua.fillStyle(o.shirt, 1).fillRoundedRect(-6, -5, 12, 22, 6);
          const fore = part(0, 15);
          const fg = this.add.graphics();
          fg.fillStyle(skin, 1).fillRoundedRect(-5, -2, 10, 17, 5);
          fg.fillStyle(skin, 1).fillCircle(0, 17, 6.5);
          fg.fillStyle(skinD, 0.5).fillCircle(3.2, 14.5, 2.4);
          fore.add(fg);
          arm.add([ua, fore]);
          N.arms[sd] = { arm, fore };
        });

        const head = part(0, -126);
        const capText = o.capText || '#2f9e6b';
        // front of the head
        const hf = part(0, 0);
        const gF = this.add.graphics();
        gF.fillStyle(skin, 1).fillCircle(-26, 5, 6).fillCircle(26, 5, 6);
        gF.fillStyle(skin, 1).fillEllipse(0, 3, 54, 50);
        gF.fillStyle(0xff8a8a, 0.35).fillCircle(-16, 14, 6).fillCircle(16, 14, 6);
        gF.fillStyle(skinD, 1).fillCircle(0, 12, 2.2);
        if (o.cap) {
          gF.fillStyle(o.cap, 1);
          gF.beginPath();
          gF.arc(0, -10, 26, Math.PI, Math.PI * 2, false);
          gF.closePath();
          gF.fillPath();
          gF.fillStyle(o.capDark || o.cap, 1).fillRoundedRect(-25, -12, 50, 7, 3);
          gF.fillStyle(0xffffff, 1).fillCircle(0, -24, 7);
        } else {
          gF.fillStyle(hairC, 1);
          gF.beginPath();
          gF.arc(0, -6, 27, Math.PI, Math.PI * 2, false);
          gF.closePath();
          gF.fillPath();
          gF.fillRoundedRect(-27, -8, 7, 16, 3).fillRoundedRect(20, -8, 7, 16, 3);
        }
        const browF = this.add.graphics();
        browF.lineStyle(3, o.cap ? 0x3a2a1e : hairC, 1);
        browF.lineBetween(-16, -4, -5, -5).lineBetween(5, -5, 16, -4);
        const eyesF = this.add.graphics();
        eyesF.fillStyle(0xffffff, 1).fillEllipse(-10, 5, 15, 17).fillEllipse(10, 5, 15, 17);
        eyesF.lineStyle(1.5, ink, 0.5).strokeEllipse(-10, 5, 15, 17).strokeEllipse(10, 5, 15, 17);
        const pupF = this.add.graphics();
        pupF.fillStyle(0x3a2a1e, 1).fillCircle(-10, 6, 4.6).fillCircle(10, 6, 4.6);
        pupF.fillStyle(0xffffff, 1).fillCircle(-8.5, 4, 1.6).fillCircle(11.5, 4, 1.6);
        const lidF = this.add.graphics().setVisible(false);
        lidF.lineStyle(2.5, ink, 1);
        lidF.beginPath().arc(-10, 5, 6, 0.15, Math.PI - 0.15).strokePath();
        lidF.beginPath().arc(10, 5, 6, 0.15, Math.PI - 0.15).strokePath();
        const mouthSF = this.add.graphics();
        mouthSF.lineStyle(2.5, ink, 1).beginPath().arc(0, 14, 8, 0.25, Math.PI - 0.25).strokePath();
        const mouthOF = this.add.graphics().setVisible(false);
        mouthOF.fillStyle(0x5b1f2a, 1).fillEllipse(0, 20, 14, 11);
        mouthOF.fillStyle(0xff7a8a, 1).fillEllipse(0, 23, 9, 5);
        hf.add([gF, browF, eyesF, pupF, lidF, mouthSF, mouthOF]);
        N.capM = o.cap ? this.add.text(0, -24, 'M', { fontSize: '10px', color: capText, fontStyle: 'bold' }).setOrigin(0.5) : null;
        if (N.capM) hf.add(N.capM);
        N.fF = { eyes: eyesF, pupils: pupF, lids: lidF, mouthS: mouthSF, mouthO: mouthOF };

        // back of the head
        const hb = part(0, 0);
        const gB = this.add.graphics();
        gB.fillStyle(skin, 1).fillCircle(-26, 5, 6).fillCircle(26, 5, 6);
        gB.fillStyle(o.cap || hairC, 1).fillEllipse(0, 2, 54, 52);
        if (o.cap) gB.fillStyle(o.capDark || o.cap, 1).fillRoundedRect(-25, -4, 50, 7, 3);
        else gB.fillStyle(0xffffff, 0.08).fillEllipse(-8, -8, 22, 12);
        hb.add(gB);

        // side of the head (he faces right; the whole body is mirrored to face left)
        const hs = part(0, 0);
        const gS = this.add.graphics();
        gS.fillStyle(skin, 1).fillEllipse(3, 4, 46, 50);
        gS.fillStyle(skinD, 1).fillCircle(26, 12, 2.6);
        gS.fillStyle(0xff8a8a, 0.35).fillCircle(15, 15, 5);
        gS.fillStyle(o.cap || hairC, 1).fillEllipse(-12, 2, 26, 40);
        gS.fillStyle(o.cap || hairC, 1);
        gS.beginPath();
        gS.arc(2, -6, 26, Math.PI, Math.PI * 2, false);
        gS.closePath();
        gS.fillPath();
        if (o.cap) gS.fillStyle(o.capDark || o.cap, 1).fillRoundedRect(12, -14, 28, 6, 3);
        gS.fillStyle(skin, 1).fillCircle(-5, 7, 6);
        gS.fillStyle(skinD, 0.6).fillCircle(-5, 7, 3);
        const browS = this.add.graphics();
        browS.lineStyle(3, o.cap ? 0x3a2a1e : hairC, 1);
        browS.lineBetween(8, -3, 19, -4);
        const eyesS = this.add.graphics();
        eyesS.fillStyle(0xffffff, 1).fillEllipse(13, 5, 11, 15);
        eyesS.lineStyle(1.5, ink, 0.5).strokeEllipse(13, 5, 11, 15);
        const pupS = this.add.graphics();
        pupS.fillStyle(0x3a2a1e, 1).fillCircle(15, 6, 4.2);
        pupS.fillStyle(0xffffff, 1).fillCircle(16, 4, 1.5);
        const lidS = this.add.graphics().setVisible(false);
        lidS.lineStyle(2.5, ink, 1);
        lidS.beginPath().arc(13, 5, 5.5, 0.15, Math.PI - 0.15).strokePath();
        const mouthSS = this.add.graphics();
        mouthSS.lineStyle(2.5, ink, 1).beginPath().arc(18, 13, 6, 0.25, Math.PI - 0.25).strokePath();
        const mouthOS = this.add.graphics().setVisible(false);
        mouthOS.fillStyle(0x5b1f2a, 1).fillEllipse(20, 20, 8, 9);
        hs.add([gS, browS, eyesS, pupS, lidS, mouthSS, mouthOS]);
        N.fS = { eyes: eyesS, pupils: pupS, lids: lidS, mouthS: mouthSS, mouthO: mouthOS };

        head.add([hf, hb, hs]);
        const items = [N.arms.L.arm, torso, neck];
        if (N.tagTxt) items.push(N.tagTxt);
        items.push(N.arms.R.arm, head);
        upper.add(items);
        root.add([N.legs.L.leg, N.legs.R.leg, upper]);

        N.upper = upper;
        N.head = head;
        N.armL = N.arms.L.arm;
        N.armR = N.arms.R.arm;
        N.legL = N.legs.L.leg;
        N.legR = N.legs.R.leg;
        N.hf = hf;
        N.hb = hb;
        N.hs = hs;
        this.setNpcView(N, 'front');
        return N;
      }

      // turn a person to face the camera (front), away (back) or sideways (side)
      setNpcView(N, view) {
        N.view = view;
        N.drawBody(view);
        const side = view === 'side';
        N.legs.L.leg.x = side ? -3 : -10;
        N.legs.R.leg.x = side ? 3 : 10;
        N.arms.L.arm.x = side ? -2 : -26;
        N.arms.R.arm.x = side ? 2 : 26;
        ['L', 'R'].forEach(k => {
          N.legs[k].shoeFB.setVisible(!side);
          N.legs[k].shoeS.setVisible(side);
        });
        N.hf.setVisible(view === 'front');
        N.hb.setVisible(view === 'back');
        N.hs.setVisible(side);
        if (N.tagTxt) N.tagTxt.setVisible(view === 'front');
      }

      // st keeps the walk phase, blink times and (optionally) st.face = 'back' or 'side' for when he stands still.
      animNpc(N, st, now, delta, moving, look, talking, waving) {
        const dt = Math.min(delta, 100) / 1000;
        const rad = Phaser.Math.DegToRad;
        const root = N.root;
        if (N.px === undefined) { N.px = root.x; N.py = root.y; }
        const vx = root.x - N.px;
        const vy = root.y - N.py;
        N.px = root.x;
        N.py = root.y;
        const sp = Math.hypot(vx, vy);
        if (moving && sp > 0.01) {
          const k = Math.min(1, delta / 110);
          N.hx += (vx / sp - N.hx) * k;
          N.hy += (vy / sp - N.hy) * k;
        }

        // which way is the body turned
        let want = N.view;
        if (talking || waving) want = 'front';
        else if (moving) want = Math.abs(N.hy) > Math.abs(N.hx) * 1.1 ? (N.hy > 0 ? 'front' : 'back') : 'side';
        else if (st.face) want = st.face;
        if (want !== N.view) {
          N.pendT = (N.pend === want ? N.pendT : 0) + dt;
          N.pend = want;
          if (N.pendT > 0.1) { this.setNpcView(N, want); N.pendT = 0; }
        } else {
          N.pendT = 0;
        }
        const view = N.view;
        const side = view === 'side';
        if (side) {
          if (moving && Math.abs(N.hx) > 0.2) N.dir = N.hx > 0 ? 1 : -1;
          else if (!moving && look) N.dir = look > 0 ? 1 : -1;
          root.scaleX = N.dir;
        } else {
          root.scaleX = 1;
        }

        // the walk: stride speed follows how fast he actually moves
        st.amp += ((moving ? 1 : 0) - st.amp) * Math.min(1, delta / 90);
        const pps = sp / Math.max(dt, 0.001);
        if (moving) st.phase += dt * Math.PI * 2 * Math.max(0.9, Math.min(3.2, pps / 50));
        const a = st.amp;
        const s = Math.sin(st.phase);

        ['L', 'R'].forEach((sd, i) => {
          const L = N.legs[sd];
          const p = st.phase + (i ? Math.PI : 0);
          if (side) {
            L.leg.rotation = -rad(30 * Math.sin(p)) * a;
            L.shin.rotation = rad((6 + 46 * Math.max(0, Math.cos(p))) * a);
            L.foot.rotation = -(L.leg.rotation + L.shin.rotation) * 0.7;      // the ankle keeps the foot flatter
            L.leg.y = -46;
            L.leg.scaleY = 1;
          } else {
            const lift = Math.max(0, Math.sin(p)) * a;
            L.leg.rotation = 0;
            L.shin.rotation = 0;
            L.foot.rotation = 0;
            L.leg.y = -46 - 6 * lift;
            L.leg.scaleY = 1 - 0.08 * lift;
          }
        });
        N.upper.y = Math.sin(now / 480 + N.bob) * 1.1 * (1 - a) - 4 * Math.abs(s) * a;
        N.upper.x = side ? 0 : s * 1.6 * a;

        // small idle gestures when he just stands there facing you
        const idle = !moving && !talking && !waving && view === 'front';
        if (idle && now > N.idleAt) {
          N.idleKind = ['look', 'scratch', 'shrug'][Math.floor(Math.random() * 3)];
          N.idleUntil = now + 1900 + Math.random() * 800;
          N.idleAt = N.idleUntil + 6000 + Math.random() * 7000;
        }
        const gesture = idle && now < N.idleUntil ? N.idleKind : '';

        ['L', 'R'].forEach((sd, i) => {
          const A = N.arms[sd];
          const sg = sd === 'L' ? 1 : -1;                 // +1 turns the arm outward on the left, -1 on the right
          const pa = st.phase + (i ? 0 : Math.PI);        // arms swing against the legs
          let rot;
          let el;
          if (side) {
            rot = -rad(26 * Math.sin(pa)) * a;
            el = -rad(6 + a * (8 + 24 * Math.max(0, Math.sin(pa))));
          } else {
            rot = rad(sg * (5 + 7 * Math.sin(pa) * a));
            el = -rad(sg * (6 + 8 * a));
          }
          rot += rad(sg * 1.2 * Math.sin(now / 900 + N.bob + i)) * (1 - a);
          if (waving && sd === 'R') {
            rot = -rad(132);
            el = rad(26 * Math.sin(now / 90));
          } else if (talking) {
            if (sd === 'R') {
              rot = -rad(34 + 10 * Math.sin(now / 210));
              el = rad(62 + 26 * Math.sin(now / 170 + 1));
            } else {
              rot = rad(9 + 5 * Math.sin(now / 300));
              el = -rad(14 + 10 * Math.sin(now / 260 + 2));
            }
          } else if (gesture === 'scratch' && sd === 'R') {
            rot = -rad(100);
            el = -rad(120 + 8 * Math.sin(now / 110));
          } else if (gesture === 'shrug') {
            rot = rad(sg * 24);
            el = rad(sg * 105);
          }
          A.arm.rotation = rot;
          A.fore.rotation = el;
        });

        // head and face
        const lk = look || 0;
        let hr = lk * 3 + (talking ? Math.sin(now / 200) * 2.5 : 0);
        if (gesture === 'look') hr += 14 * Math.sin(now / 380);
        N.head.rotation = rad(hr);
        if (now > st.nextBlink) { st.blinkUntil = now + 130; st.nextBlink = now + 2000 + Math.random() * 3000; }
        const shut = now < st.blinkUntil;
        const open = waving || (talking && Math.floor(now / 140) % 2 === 0);
        [N.fF, N.fS].forEach(f => {
          f.eyes.setVisible(!shut);
          f.pupils.setVisible(!shut);
          f.lids.setVisible(shut);
          f.mouthO.setVisible(open);
          f.mouthS.setVisible(!open);
        });
        N.fF.pupils.x = lk * 2.4;
        // depth cue: people near the back wall look a little smaller, people near the camera a little bigger
        const dk = 0.9 + 0.2 * Phaser.Math.Clamp((root.y - WALL_H) / (H - WALL_H), 0, 1);
        root.scaleX *= dk;
        root.scaleY = dk;
      }

      spawnFriend() {
        const px = this.player.x;
        const py = this.player.y;
        const offs = [[-240, 40], [240, 40], [0, 220], [-170, 170], [170, 170], [0, -200]];
        let spot = null;
        for (const o of offs) {
          const x = px + o[0];
          const y = py + o[1];
          if (x < 60 || x > W - 60 || y < WALL_H + 40 || y > H - 40) continue;
          let free = true;
          for (let t = 0.25; t <= 1; t += 0.25) {
            if (this.blocked(px + o[0] * t, py + o[1] * t)) free = false;
          }
          if (free) { spot = [x, y]; break; }
        }
        if (!spot) spot = [Math.min(W - 60, px + 130), py];
        const f = { x: spot[0], y: spot[1], origin: spot, state: 'in', phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0, waveUntil: 0 };
        this.friend = f;
        this.friendNpc = this.makeNpc({ x: f.x, y: f.y, shirt: 0xe8772e, pants: 0x3b3f5c, hair: 0x1d1d1d, skin: 0xd9a066 });
        this.friendShadow = this.add.ellipse(f.x, f.y - 2, 70, 16, 0x000000, 0.25);
        this.friendNpc.root.setAlpha(0);
        this.friendShadow.setAlpha(0);
        this.tweens.add({ targets: [this.friendNpc.root, this.friendShadow], alpha: 1, duration: 450 });
        SFX.tone(784, 0.12, 'sine', 0.06);
        SFX.tone(988, 0.2, 'sine', 0.06, 0.12);
      }

      updateFriend(delta) {
        const f = this.friend;
        if (!f || !this.friendNpc) return;
        const N = this.friendNpc;
        const now = this.time.now;
        const dt = delta / 1000;
        const px = this.player.x;
        const py = this.player.y;
        let moving = false;
        let look = 0;
        let talking = false;
        const waving = now < f.waveUntil;

        if (f.state === 'in') {
          const dx = px - f.x;
          const dy = py - f.y;
          const dist = Math.hypot(dx, dy);
          look = Math.sign(dx);
          if (dist > 120) {
            const step = Math.min(dist - 120, FRIEND_SPEED * dt);
            f.x += (dx / dist) * step;
            f.y += (dy / dist) * step;
            moving = true;
          } else {
            f.state = 'ask';
            f.waveUntil = now + 1400;
            friendAsk();
          }
        } else if (f.state === 'ask') {
          look = Math.sign(px - f.x);
          talking = true;
        } else if (f.state === 'out') {
          const dx = f.origin[0] - f.x;
          const dy = f.origin[1] - f.y;
          const dist = Math.hypot(dx, dy);
          look = Math.sign(dx);
          if (dist > 6) {
            const step = Math.min(dist, FRIEND_SPEED * dt);
            f.x += (dx / dist) * step;
            f.y += (dy / dist) * step;
            moving = true;
          } else {
            f.state = 'gone';
            this.tweens.add({
              targets: [N.root, this.friendShadow], alpha: 0, duration: 400,
              onComplete: () => { N.root.destroy(); this.friendShadow.destroy(); this.friend = null; this.friendNpc = null; }
            });
          }
        }

        N.root.setPosition(f.x, f.y).setDepth(f.y);
        this.friendShadow.setPosition(f.x, f.y - 2).setDepth(f.y - 1);
        this.animNpc(N, f, now, delta, moving, look, talking, waving);
      }

      buildCashier() {
        const p = CASHIER_POS;
        this.ck = { x: p.x, y: p.y, phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0, talkUntil: 0, waveUntil: 0 };
        this.ckNpc = this.makeNpc({ x: p.x, y: p.y, shirt: 0x7a4de0, pants: 0x2a2f4a, hair: 0x5a3a22, skin: 0xe0a878 });
        this.ckNpc.root.setDepth(p.y);       // lower than the counter art, so she stands behind it
      }

      updateCashier(delta) {
        const c = this.ck;
        if (!c || !this.ckNpc) return;
        const now = this.time.now;
        const dx = this.player.x - c.x;
        const near = Math.hypot(dx, this.player.y - c.y) < 420;
        const talking = now < c.talkUntil;
        const waving = now < c.waveUntil;
        const cu = this.cust;
        const serving = !!cu && cu.state === 'pay';
        if (c.nextGlance === undefined) c.nextGlance = 0;
        if (now > c.nextGlance) {
          c.glanceUntil = now + 1400;
          c.glanceDir = Math.random() < 0.5 ? -1 : 1;
          c.nextGlance = now + 4000 + Math.random() * 4000;
        }
        const glancing = now < (c.glanceUntil || 0);
        let look = near ? Math.sign(dx) : 0;
        if (serving && !near) look = Math.sign(cu.x - c.x);
        else if (glancing && !near) look = c.glanceDir;
        this.animNpc(this.ckNpc, c, now, delta, false, look, talking || serving, waving);
        if (glancing && !talking && !waving && !serving) {
          this.ckNpc.armR.rotation = Phaser.Math.DegToRad(-(30 + 6 * Math.sin(now / 110)));
        }
      }

      buildCustomer() {
        const r = CUSTOMER_ROUTE[0];
        this.cust = { x: r.x, y: r.y, wp: 1, state: 'walk', until: 0, reachAt: 0, decided: false, itemObj: null, phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0 };
        this.custNpc = this.makeNpc({ x: r.x, y: r.y, shirt: 0xd9486f, pants: 0x4a3f6b, hair: 0x8a8a8a, skin: 0xc68c5a });
        this.custShadow = this.add.ellipse(r.x, r.y - 2, 70, 16, 0x000000, 0.25);
        this.custObst = { x: r.x - 24, y: r.y - 8, w: 48, h: 16 };
        this.obst.push(this.custObst);
      }

      customerDrop(text) {
        const m = this.cust;
        if (m.itemObj) { m.itemObj.destroy(); m.itemObj = null; }
        this.popText(m.x, m.y - 170, text, '#ffffff');
      }

      updateCustomer(delta) {
        const m = this.cust;
        const N = this.custNpc;
        if (!m || !N) return;
        const now = this.time.now;
        const dt = delta / 1000;
        const dp = Math.hypot(this.player.x - m.x, this.player.y - m.y);
        let moving = false;
        let look = 0;
        let reaching = false;

        if (m.state === 'walk') {
          if (dp < 80) {
            look = Math.sign(this.player.x - m.x);      // you are in his way: he waits
          } else {
            const t = CUSTOMER_ROUTE[m.wp];
            const dx = t.x - m.x;
            const dy = t.y - m.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 5) {
              if (t.pay && m.itemObj) {
                m.state = 'pay';
                m.until = now + 2600;
              } else if (t.browse) {
                m.state = 'browse';
                m.reachAt = now + 900;
                m.until = now + 3200 + Math.random() * 1600;
                m.decided = false;
              } else {
                m.wp = (m.wp + 1) % CUSTOMER_ROUTE.length;
              }
            } else {
              const step = Math.min(dist, CUSTOMER_SPEED * dt);
              m.x += (dx / dist) * step;
              m.y += (dy / dist) * step;
              moving = true;
              look = Math.sign(dx);
            }
          }
        } else if (m.state === 'browse') {
          reaching = now > m.reachAt && now < m.reachAt + 900;
          if (!m.decided && now > m.reachAt + 450) {
            m.decided = true;
            if (m.itemObj) {
              if (Math.random() < 0.35) this.customerDrop('Put back');     // he changes his mind
            } else if (Math.random() < 0.65) {
              // he takes a real product off the shelf and carries it in his hand
              const pool = this.products.filter(p => this.textures.exists('pr-' + p.item.id));
              if (pool.length) {
                const pk = pool[Math.floor(Math.random() * pool.length)];
                const it = this.add.image(0, 24, 'pr-' + pk.item.id).setOrigin(0.5, 0.5);
                it.setScale(24 / Math.max(it.height, 1));
                m.itemObj = it;
                N.arms.R.fore.add(it);
              }
            }
          }
          if (now > m.until) {
            m.state = 'walk';
            m.wp = (m.wp + 1) % CUSTOMER_ROUTE.length;
          }
        } else if (m.state === 'pay') {
          look = 1;
          if (now > m.until) {
            this.customerDrop('Paid');
            m.state = 'walk';
            m.wp = (m.wp + 1) % CUSTOMER_ROUTE.length;
          }
        }

        N.root.setPosition(m.x, m.y).setDepth(m.y);
        this.custShadow.setPosition(m.x, m.y - 2).setDepth(m.y - 1);
        this.custObst.x = m.x - 24;
        this.custObst.y = m.y - 8;
        m.face = m.state === 'browse' ? 'back' : (m.state === 'pay' ? 'side' : null);   // faces the shelf, or the counter
        this.animNpc(N, m, now, delta, moving, look, false, false);
        const rad = Phaser.Math.DegToRad;
        if (reaching) {
          N.armR.rotation = rad(-(150 + 8 * Math.sin(now / 120)));        // reaches up to the shelf
          N.arms.R.fore.rotation = rad(-8);
        } else if (m.itemObj) {
          N.armR.rotation = rad(-40);                                      // holds the product in front of him
          N.arms.R.fore.rotation = rad(75);
        }
        if (m.itemObj) m.itemObj.scaleX = Math.abs(m.itemObj.scaleX) * (N.root.scaleX < 0 ? -1 : 1);
      }

      // ambient shoppers: they just walk their loops, so the store feels busy
      buildCrowd() {
        const specs = [
          { shirt: 0xe8b923, pants: 0x3a4a6b, hair: 0x2a1a12, skin: 0xb98558, speed: 54, route: [[200, 430], [1150, 430], [1150, 490], [200, 490]] },
          { shirt: 0x2fb7a6, pants: 0x4a3a5c, hair: 0x7a4a22, skin: 0xe8b88a, speed: 46, route: [[150, 820], [900, 820], [900, 900], [150, 900]] },
          { shirt: 0xc2543c, pants: 0x2f3b52, hair: 0x1d1d1d, skin: 0xd9a066, speed: 50, route: [[730, 410], [730, 880], [800, 880], [800, 410]] }
        ];
        this.crowd = specs.map((s, i) => {
          const r = s.route[0];
          const c = { x: r[0], y: r[1], wp: 1, wait: i * 1800, phase: 0, amp: 0, nextBlink: 0, blinkUntil: 0, speed: s.speed, route: s.route };
          c.npc = this.makeNpc({ x: r[0], y: r[1], shirt: s.shirt, pants: s.pants, hair: s.hair, skin: s.skin });
          c.shadow = this.add.ellipse(r[0], r[1] - 2, 70, 16, 0x000000, 0.25);
          return c;
        });
      }

      updateCrowd(delta) {
        if (!this.crowd) return;
        const now = this.time.now;
        const dt = delta / 1000;
        this.crowd.forEach(c => {
          const dp = Math.hypot(this.player.x - c.x, this.player.y - c.y);
          let moving = false;
          let look = 0;
          if (dp < 90) {
            look = Math.sign(this.player.x - c.x);       // you are in the way: they wait
          } else if (c.wait > 0) {
            c.wait -= delta;
          } else {
            const t = c.route[c.wp];
            const dx = t[0] - c.x;
            const dy = t[1] - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 5) {
              c.wp = (c.wp + 1) % c.route.length;
              c.wait = Math.random() < 0.4 ? 800 + Math.random() * 1800 : 0;
            } else {
              const step = Math.min(dist, c.speed * dt);
              c.x += (dx / dist) * step;
              c.y += (dy / dist) * step;
              moving = true;
              look = Math.sign(dx);
            }
          }
          c.npc.root.setPosition(c.x, c.y).setDepth(c.y);
          c.shadow.setPosition(c.x, c.y - 2).setDepth(c.y - 1);
          this.animNpc(c.npc, c, now, delta, moving, look, false, false);
        });
      }

      dust(x, y) {
        const d = this.add.circle(x + (Math.random() - 0.5) * 16, y - 3, 4 + Math.random() * 3, 0xf1e6cf, 0.45).setDepth(y - 2);
        this.tweens.add({ targets: d, y: d.y - 8, scale: 2.2, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => d.destroy() });
      }
      
      burst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const d = 40 + Math.random() * 50;
          const dot = this.add.circle(x, y, 4 + Math.random() * 3, color, 1).setDepth(100000);
          this.tweens.add({
            targets: dot,
            x: x + Math.cos(a) * d,
            y: y + Math.sin(a) * d - 20,
            alpha: 0,
            scale: 0.3,
            duration: 500 + Math.random() * 250,
            ease: 'Sine.easeOut',
            onComplete: () => dot.destroy()
          });
        }
      }

      popText(x, y, text, color) {
        const t = this.add.text(x, y, text, {
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          fontSize: '26px', color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setDepth(100000);
        this.tweens.add({ targets: t, y: y - 60, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
      }

      restoreToShelf(product) {
        if (product.keep) { product.keep.destroy(); product.keep = null; }
        const src = sources[product.item.id];
        const baseY = product.y + 26;
        const obj = src.src
          ? this.add.image(product.x, baseY - 30, 'pr-' + product.item.id).setOrigin(0.5, 1)
          : this.add.text(product.x, baseY - 30, src.emoji, { fontSize: '44px' }).setOrigin(0.5, 1);
        obj.setScale(product.baseScale).setDepth(product.sy + 1);
        this.tweens.add({ targets: obj, y: baseY, duration: 260, ease: 'Bounce.easeOut' });
        product.obj = obj;
        product.label = this.add.text(product.x, product.sy - 15, priceText(product.item), {
          fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(product.sy + 2);
        product.taken = false;
      }

      updateCart() {
        const dir = this.faceLeft ? -1 : 1;
        const tx = this.player.x + dir * CART_GAP;
        if (dir !== this.cartSide) {
          this.cartSide = dir;
          this.cartImg.setTexture(dir === 1 ? 'cart-right' : 'cart-left');
          this.cartBox.list.forEach(o => { if (o !== this.cartImg) o.x = -o.x; });
          this.cartBox.x = tx;
        }
        this.cartBox.x += (tx - this.cartBox.x) * 0.4;
        this.cartBox.y = this.player.y;
        this.cartBox.setDepth(this.player.y + 1);
        if (session.cartSkin && session.cartSkin.rainbow && this.cartImg) {
          const hue = Phaser.Display.Color.HSVToRGB((this.time.now / 1500) % 1, 0.6, 1);
          this.cartImg.setTint(Phaser.Display.Color.GetColor(hue.r, hue.g, hue.b));
        }

        // hand on the handle (the side view has no arm art, so a sleeve and a hand are drawn)
        this.grip.clear();
        if (this.puppet && this.puppet.view === 'side' && this.time.now >= this.reachUntil) {
          const hx = this.cartBox.x - dir * CART_W * 0.45;
          const hy = this.player.y - CART_W * 0.7;
          const sx = this.player.x + dir * 4;
          const sy = this.player.y - 88;
          this.grip.lineStyle(11, 0x141824, 1).lineBetween(sx, sy, hx, hy);
          this.grip.fillStyle(0xf1b27a, 1).fillCircle(hx, hy, 6.5);
          this.grip.setDepth(this.player.y + 2);
        }
      }

      update(time, delta) {
        if (!document.body.contains(holder)) { destroyGame(); return; }

        const dt = delta / 1000;
        tickClock(dt);
        tickSale(dt);
        tickHike();
        tickClosing(dt);
        tickFriend();
        tickCashier();
        tickAmbient(dt);
        const wantMood = (S.closed || S.timeLeft <= CLOSING_SECONDS * 0.25 || (rivalCtl && rivalCtl.active())) ? 'tense' : (S.basket.length >= 3 ? 'groove' : 'calm');
        if (SFX.setMood) SFX.setMood(wantMood);
        if (rivalCtl) rivalCtl.tick(dt, this, delta);
        if (trickCtl) trickCtl.tick(this);
        let ix = S.ctl.x;
        let iy = S.ctl.y;
        const k = this.keys;
        if (k.LEFT.isDown || k.A.isDown) ix -= 1;
        if (k.RIGHT.isDown || k.D.isDown) ix += 1;
        if (k.UP.isDown || k.W.isDown) iy -= 1;
        if (k.DOWN.isDown || k.S.isDown) iy += 1;
        const len = Math.hypot(ix, iy);
        if (len > 1) { ix /= len; iy /= len; }
        const moving = !S.busy && len > 0.12;

        if (moving) {
          const px = this.player.x;
          const py = this.player.y;
          let nx = Phaser.Math.Clamp(px + ix * SPEED * dt, 40, W - 40);
          if (this.blocked(nx, py)) nx = px;
          let ny = Phaser.Math.Clamp(py + iy * SPEED * 0.8 * dt, WALL_H + 20, H - 30);
          if (this.blocked(nx, ny)) ny = py;
          this.player.x = nx;
          this.player.y = ny;
          if (Math.abs(ix) > 0.12) this.faceLeft = ix < 0;

          this.stepClock = (this.stepClock || 0) + delta;
          if (this.stepClock > 340) { this.stepClock = 0; SFX.step(); this.dust(this.player.x, this.player.y); }
          if (!this.puppet) {
            this.walkClock += delta;
            if (this.walkClock > 260) {
              this.walkClock = 0;
              this.walkFlip = !this.walkFlip;
              this.player.setTexture(this.walkFlip ? 'pl-walk2' : 'pl-walk1');
            }
          }
        } else if (!this.puppet) {
          this.player.setTexture('pl-idle');
          this.walkClock = 0;
        }

        if (this.puppet) this.animPuppet(delta, this.time.now, moving, ix, iy);
        else this.player.setFlipX(FACES_RIGHT ? this.faceLeft : !this.faceLeft);
        if (this.puppet) {
          const ps = 0.9 + 0.2 * Phaser.Math.Clamp((this.player.y - WALL_H) / (H - WALL_H), 0, 1);
          this.player.scaleX = Math.sign(this.player.scaleX || 1) * MM_SCALE * ps;
          this.player.scaleY = MM_SCALE * ps;
        }
        this.player.setDepth(this.player.y);
        if (this.cartBox) this.updateCart();
        this.updateShopkeeper(delta);
        this.updateFriend(delta);
        this.updateCashier(delta);
        this.updateCustomer(delta);
        this.updateCrowd(delta);
        this.updateFridges();
        this.shadow.setPosition(this.player.x, this.player.y - 2).setDepth(this.player.y - 1);

        if (Phaser.Input.Keyboard.JustDown(k.SPACE)) grabBtn.click();

        const near = nearestProduct(this);
        // a little arrow bounces over the item you can grab (green when you can put it back)
        if (!this.hint) this.hint = this.add.triangle(0, 0, 0, 0, 22, 0, 11, 16, 0xffd34d).setDepth(100002).setVisible(false);
        if (near && !S.busy) {
          this.hint.setVisible(true);
          this.hint.setFillStyle(near.taken ? 0x7ee2a8 : 0xffd34d, 1);
          this.hint.setPosition(near.x, near.y - 40 + Math.sin(time / 170) * 4);
        } else {
          this.hint.setVisible(false);
        }
        const atCounter = !near && inCheckoutZone(this);
        if (atCounter && !S.zoneHint && S.basket.length > 0) {
          S.zoneHint = true;
          if (!assistant.pending) say('Ready to pay? Tap Checkout.');
        }
        const id = near ? near.item.id + (near.taken ? ':back' : '') : (atCounter ? '__counter' : '');
        if (id !== S.nearId) {
          S.nearId = id;
if (near && !near.taken && near.item && near.item.hot) {
  this.hotSaid = this.hotSaid || {};
  if (!this.hotSaid[near.item.id] && !assistant.pending) {
    this.hotSaid[near.item.id] = true;
    assistant.say(near.item.hot.line);
  }
}
          this.products.forEach(p => { if (!p.taken) p.obj.setScale(p.baseScale * (p === near ? 1.2 : 1)); });
          if (near && near.taken) { grabBtn.disabled = false; grabBtn.innerHTML = `↩ Put back<small>${esc(near.item.name)}</small>`; }
          else if (near) { grabBtn.disabled = false; grabBtn.innerHTML = `✋ Grab<small>${esc(near.item.name)}</small>`; }
          else if (atCounter) { grabBtn.disabled = false; grabBtn.innerHTML = '🧾 Checkout'; }
          else { grabBtn.disabled = true; grabBtn.innerHTML = '✋ Grab'; }
        }
      }
    }

    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: holder,
      width: VIEW_W,
      height: Math.round(VIEW_W * (holder.clientHeight || VIEW_H) / Math.max(holder.clientWidth || VIEW_W, 1)),
      backgroundColor: '#0d1324',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: MartScene
    });
  }

  // Always route through the world switch, even if another file assigns startMiimiidShop later.
  function worldEntry() {
    if (worldOn()) return startWorld();
    return typeof originalStart === 'function' ? originalStart.apply(this, arguments) : undefined;
  }
  try {
    Object.defineProperty(window, 'startMiimiidShop', {
      configurable: true,
      get() { return worldEntry; },
      set(fn) { if (typeof fn === 'function' && fn !== worldEntry) originalStart = fn; }
    });
  } catch (e) {
    window.startMiimiidShop = worldEntry;
  }
})();
    
