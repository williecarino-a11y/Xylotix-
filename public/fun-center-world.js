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
    { id: 'fresh',  label: 'FRESH FOOD',     x: 60,  y: 200 },
    { id: 'dairy',  label: 'DAIRY & DRINKS', x: 320, y: 200 },
    { id: 'snacks', label: 'SNACKS',         x: 580, y: 200 },
    { id: 'care',   label: 'PERSONAL CARE',  x: 60,  y: 520 },
    { id: 'fun',    label: 'FUN CORNER',     x: 320, y: 520 }
  ];
  const CATS = {
    fresh: ['apple', 'carrot', 'bread', 'pasta'],
    dairy: ['milk', 'eggs', 'water'],
    snacks: ['chips', 'cookies', 'candy', 'pizza'],
    care: ['medicine'],
    fun: ['movie', 'headphones', 'console', 'sneakers']
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
  const ASSISTANT_PATH = [[1060, 430], [1200, 320], [1240, 540], [900, 560], [720, 660], [720, 820], [720, 660], [900, 560]];   // his patrol route
  const ASSISTANT_SPEED = 62;      // how fast he walks
  const saleNow = { cur: null };   // the running flash sale (the server decides it)
  function nowPrice(item) {
    const s = saleNow.cur;
    return s && s.itemId === item.id && Date.now() < s.endsAt ? s.salePrice : item.price;
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
      .mw-asst { position: absolute; left: 10px; right: 10px; top: 10px; display: none; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.96); border: 2px solid #2f9e6b; color: #1b2440; border-radius: 14px; padding: 8px 12px; font-size: 14px; line-height: 1.3; pointer-events: none; z-index: 6; }
      .mw-asst.show { display: flex; animation: mwSlide .25s ease-out; }
      .mw-asst-face { width: 34px; height: 34px; flex: none; border-radius: 50%; background: #2f9e6b; display: flex; align-items: center; justify-content: center; font-size: 20px; }
      .mw-asst b { display: block; font-size: 11px; color: #2f9e6b; text-transform: uppercase; letter-spacing: .04em; }
      @keyframes mwSlide { from { transform: translateY(-10px); opacity: 0; } to { transform: none; opacity: 1; } }
      .mw-sale { display: none; margin: 0 4px 6px; padding: 6px 10px; border-radius: 10px; background: linear-gradient(90deg, #e0245e, #ff7a1a); color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; animation: mwPulse .9s ease-in-out infinite; }
      .mw-sale.show { display: block; }
      .mw-controls { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px 0; }
      .mw-joy { position: relative; width: 108px; height: 108px; border-radius: 50%; background: rgba(77, 163, 255, 0.12); border: 2px solid rgba(77, 163, 255, 0.45); touch-action: none; user-select: none; }
      .mw-joy-knob { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #1f6feb; box-shadow: 0 4px 12px rgba(0,0,0,.4); pointer-events: none; transition: transform .1s ease-out; }
      .mw-grab { width: 104px; height: 104px; border-radius: 50%; border: 3px solid #4da3ff; background: #1f6feb; color: #fff; font-size: 16px; font-weight: 800; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; }
      .mw-grab small { font-size: 11px; font-weight: 600; max-width: 84px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mw-grab:disabled { opacity: .4; background: #232c42; border-color: #232c42; cursor: default; }
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
          <span class="mw-count">🛒 <span data-mw-count>0</span></span>
          <button type="button" class="mw-leave" data-mw-mute>🔊</button>
          <button type="button" class="mw-leave" data-mw-leave>Leave</button>
        </div>
        <div class="mw-clock"><span>🕒 Store closes</span><div class="mw-clock-bar"><div class="mw-clock-fill" data-mw-clock data-level="high"></div></div></div>
        <div class="mw-sale" data-mw-sale></div>
        <div class="mw-list" data-mw-list></div>
        <div class="mw-holder" data-mw-holder>
          <div class="mw-asst" data-mw-asst><span class="mw-asst-face">🧑‍🍳</span><div><b>Sam · Store assistant</b><span data-mw-asst-text></span></div></div>
          <div class="mw-bubble" data-mw-bubble>Check your list! Grab what you need and keep an eye on your wallet.</div>
        </div>
        <div class="mw-controls">
          <div class="mw-joy" data-mw-joy><div class="mw-joy-knob" data-mw-knob></div></div>
          <button type="button" class="mw-grab" data-mw-grab disabled>✋ Grab</button>
        </div>
      </div>
    `;

    const holder = content.querySelector('[data-mw-holder]');
    const bubble = content.querySelector('[data-mw-bubble]');
    const walletEl = content.querySelector('[data-mw-wallet]');
    const countEl = content.querySelector('[data-mw-count]');
    const grabBtn = content.querySelector('[data-mw-grab]');

    function say(text) { bubble.textContent = text; }

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
        SFX.tone(330, 0.35, 'triangle', 0.1);
        SFX.tone(247, 0.5, 'triangle', 0.1, 0.18);
        say('Closing time! Head to the counter to pay. You can still put things back.');
        assistant.react('closed');
      }
    }
    // shop assistant: reacts to what you do, never says need or want
    const assistant = {
      greeted: false, lowSaid: false, tightSaid: false, lastLine: '', lastAt: 0,
      lines: {
        greet: ['Welcome to Miimiid Mart! Check your list and watch your wallet.', 'Hi there! Prices are on the shelves. Take your time, but not too long!'],
        first: ['First one in the cart! Keep an eye on the total.', 'Off to a start! Remember, every dollar counts.'],
        cheap: ['Easy on the wallet.', 'Small price, small dent.'],
        mid: ['Good one. Keep an eye on the total.', 'That adds up. Check your wallet now and then.'],
        pricey: ['Oof, that one costs a lot. Will you have enough left?', 'Big price tag! Make sure it fits your plan.'],
        low: ['Your wallet is getting light. Count carefully!', 'Under $10 left. Choose wisely.'],
        tight: ['Only a few dollars left! Be careful now.', 'Almost out of money! Think before you grab.'],
        putback: ['Changing your mind? Thinking twice is smart.', 'Back it goes. Every dollar counts.'],
        warn: ['We close soon! Anything you forgot?', 'Clock is ticking. Is your cart ready?'],
        closed: ['Closing time! Please head to the counter.', 'We are closed. Time to pay at the counter.']
      },
      say(text) {
        const box = holder.querySelector('[data-mw-asst]');
        if (box) {
          box.querySelector('[data-mw-asst-text]').textContent = text;
          box.classList.add('show');
          clearTimeout(this.hideTimer);
          this.hideTimer = setTimeout(() => box.classList.remove('show'), 4200);
        }
        const scene = game && game.scene.getScene('mart');
        if (scene && scene.shopkeeperTalk) scene.shopkeeperTalk();
      },
      pick(key) {
        const list = this.lines[key];
        let line = list[Math.floor(Math.random() * list.length)];
        if (list.length > 1 && line === this.lastLine) line = list[(list.indexOf(line) + 1) % list.length];
        this.lastLine = line;
        return line;
      },
      react(kind, d) {
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

    const listEl = content.querySelector('[data-mw-list]');
    const needItems = shop.items.filter(it => NEED_IDS.includes(it.id));
    listEl.innerHTML = '<span class="mw-list-title">🛒 Shopping list</span>' +
      needItems.map(it => `<span class="mw-chip" data-need="${esc(it.id)}">${esc(it.name)}</span>`).join('');
    function hud() {
      walletEl.textContent = `$${S.budget - S.spent}`;
      countEl.textContent = String(S.basket.length);
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
    muteBtn.textContent = SFX.muted ? '🔇' : '🔊';
    muteBtn.addEventListener('click', () => { muteBtn.textContent = SFX.toggleMute() ? '🔇' : '🔊'; });
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
      const item = product.item;
      S.busy = true;
      try {
        let optionId;
        if (hasOptions(item)) {
          optionId = await pickOption(item);
          if (!optionId) { say('No rush. Look around some more.'); return; }
        } else if (item.price > S.budget - S.spent) {
          say(`${item.name} costs $${item.price}, but you only have $${S.budget - S.spent} left.`);
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
        product.taken = true;
        scene.flyToCart(product);
        scene.popText(scene.player.x, scene.player.y - 170, `-$${result.price}`, '#ffd34d');
        SFX.pickup();
        hud();

        const left = result.remaining;
        const todo = needItems.filter(n => !S.basket.includes(n.id)).length;
        let text = `${item.name} is in the cart.`;
        if (todo === 0) text += ' Your list is complete! Head to the counter.';
        else text += ` ${todo} left on your list.`;
        if (left <= 5) text += ` Whoa, only $${left} left!`;
        else if (left <= 10) text += ` $${left} left.`;
        say(text);
        assistant.react('grab', { price: result.price, left, count: S.basket.length });
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

    async function doCheckout() {
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
        const o = overlay(`
          <h3>Trip finished!</h3>
          <p>${esc(r.message || '')}</p>
          <p>Needs covered: <strong>${list(r.needsBought).length} / ${r.totalNeeds}</strong> &middot; Spent $${r.spent} &middot; Left $${r.saved}</p>
          <div style="max-height:230px;overflow-y:auto;margin:6px 0">${rows}</div>
          <p>+${Number.isFinite(r.xp) ? r.xp : 0} XP &middot; +${Number.isFinite(r.coins) ? r.coins : 0} coins</p>
          <button type="button" data-again>Shop again</button>
          <button type="button" class="mw-alt" data-back>Back to Fun Center</button>
        `);
        o.querySelector('[data-again]').addEventListener('click', () => { destroyGame(); startWorld(); });
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
      else if (inCheckoutZone(scene)) doCheckout();
      else say('Walk up to a shelf to grab something, or to the counter to pay.');
    });

    // ---- the store ----
    class MartScene extends Phaser.Scene {
      constructor() { super('mart'); }

      preload() {
        const barW = 400;
        const barX = (VIEW_W - barW) / 2;
        const barY = VIEW_H / 2;
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

      buildUnit(u, list) {
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

        list.forEach((item, i) => {
          const px = u.x + (UW / (list.length + 1)) * (i + 1);
          const baseY = u.y + 100;
          const src = sources[item.id];
          let obj;
          if (src.src) {
            obj = this.add.image(px, baseY, `pr-${item.id}`).setOrigin(0.5, 1);
            obj.setScale(52 / Math.max(obj.height, 1));
          } else {
            obj = this.add.text(px, baseY, src.emoji, { fontSize: '44px' }).setOrigin(0.5, 1);
          }
          obj.setDepth(u.y + UH + 1);
          const label = this.add.text(px, u.y + 125, priceText(item), {
            fontSize: '13px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
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

        // floor
        const floorKey = this.textures.exists('art-floor') ? 'art-floor' : 'floor';
        const floorTiles = this.add.tileSprite(0, WALL_H, W, H - WALL_H, floorKey).setOrigin(0, 0).setDepth(-100);
        if (floorKey === 'art-floor') floorTiles.setTileScale(0.5);
        // soft shadow under the back wall so the floor reads as a floor
        const floorShade = this.add.graphics().setDepth(-99);
        floorShade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.35, 0.35, 0, 0);
        floorShade.fillRect(30, WALL_H, W - 60, 70);

        // back wall
        const wall = this.add.graphics().setDepth(-90);
        wall.fillStyle(0x12203f, 1).fillRect(0, 0, W, WALL_H);
        wall.fillStyle(0x1f6feb, 1).fillRect(0, WALL_H - 14, W, 14);
        wall.fillStyle(0x0b1530, 1).fillRect(0, 0, 30, H).fillRect(W - 30, 0, 30, H).fillRect(0, H - 20, W, 20);
        this.add.text(W / 2, 70, 'MIIMIID MART', {
          fontSize: '46px', color: '#4da3ff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(-80);
        this.add.text(W / 2, 120, 'Smart Choices. Brighter Tomorrows.', {
          fontSize: '18px', color: '#9ec5ff'
        }).setOrigin(0.5).setDepth(-80);

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
        }

        this.arm = this.add.graphics().setDepth(99999);
        this.grip = this.add.graphics();

        // camera
        const cam = this.cameras.main;
        cam.setBounds(0, 0, W, H);
        cam.setZoom(1.2);
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
        const skin = 0xf1b27a, green = 0x2f9e6b, darkGreen = 0x237a52, navy = 0x23407a, ink = 0x141824;
        this.sk = {
          x: start[0], y: start[1], wp: 1, wait: 1500, phase: 0, amp: 0,
          talkUntil: 0, waveUntil: 0, nextBlink: 0, blinkUntil: 0
        };
        const sk = this.sk;
        this.skShadow = this.add.ellipse(sk.x, sk.y - 2, 70, 16, 0x000000, 0.25);
        this.skObst = { x: sk.x - 24, y: sk.y - 8, w: 48, h: 16 };
        this.obst.push(this.skObst);

        const part = (x, y) => this.add.container(x, y);
        const root = this.add.container(sk.x, sk.y);

        // legs
        const legL = part(-10, -46);
        const legR = part(10, -46);
        [legL, legR].forEach(leg => {
          const g = this.add.graphics();
          g.fillStyle(navy, 1).fillRoundedRect(-7, 0, 14, 38, 5);
          g.fillStyle(0x0b1530, 1).fillRoundedRect(-9, 34, 20, 12, 5);
          leg.add(g);
        });

        // body and arms
        const upper = part(0, 0);
        const torso = this.add.graphics();
        torso.fillStyle(green, 1).fillRoundedRect(-23, -106, 46, 64, 12);
        torso.fillStyle(0xffffff, 1).fillRoundedRect(-15, -86, 30, 42, 7);
        torso.fillStyle(green, 1).fillRoundedRect(-9, -80, 18, 9, 3);
        const tag = this.add.text(0, -75.5, 'STAFF', { fontSize: '8px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        const armL = part(-26, -98);
        const armR = part(26, -98);
        [armL, armR].forEach(arm => {
          const g = this.add.graphics();
          g.fillStyle(green, 1).fillRoundedRect(-6, -4, 12, 34, 6);
          g.fillStyle(skin, 1).fillCircle(0, 33, 7);
          arm.add(g);
        });

        // head and face
        const head = part(0, -126);
        const face = this.add.graphics();
        face.fillStyle(skin, 1).fillCircle(-26, 5, 6).fillCircle(26, 5, 6);
        face.fillStyle(skin, 1).fillEllipse(0, 3, 54, 50);
        face.fillStyle(0xff8a8a, 0.35).fillCircle(-16, 14, 6).fillCircle(16, 14, 6);
        face.fillStyle(0xd9965f, 1).fillCircle(0, 12, 2.2);
        face.fillStyle(green, 1);
        face.beginPath();
        face.arc(0, -10, 26, Math.PI, Math.PI * 2, false);
        face.closePath();
        face.fillPath();
        face.fillStyle(darkGreen, 1).fillRoundedRect(-25, -12, 50, 7, 3);
        face.fillStyle(0xffffff, 1).fillCircle(0, -24, 7);
        const capM = this.add.text(0, -24, 'M', { fontSize: '10px', color: '#2f9e6b', fontStyle: 'bold' }).setOrigin(0.5);
        const eyes = this.add.graphics();
        eyes.fillStyle(0xffffff, 1).fillEllipse(-10, 5, 15, 17).fillEllipse(10, 5, 15, 17);
        eyes.lineStyle(1.5, ink, 0.5).strokeEllipse(-10, 5, 15, 17).strokeEllipse(10, 5, 15, 17);
        const pupils = this.add.graphics();
        pupils.fillStyle(0x3a2a1e, 1).fillCircle(-10, 6, 4.6).fillCircle(10, 6, 4.6);
        pupils.fillStyle(0xffffff, 1).fillCircle(-8.5, 4, 1.6).fillCircle(11.5, 4, 1.6);
        const lids = this.add.graphics().setVisible(false);
        lids.lineStyle(2.5, ink, 1);
        lids.beginPath().arc(-10, 5, 6, 0.15, Math.PI - 0.15).strokePath();
        lids.beginPath().arc(10, 5, 6, 0.15, Math.PI - 0.15).strokePath();
        const mouthS = this.add.graphics();
        mouthS.lineStyle(2.5, ink, 1).beginPath().arc(0, 14, 8, 0.25, Math.PI - 0.25).strokePath();
        const mouthO = this.add.graphics().setVisible(false);
        mouthO.fillStyle(0x5b1f2a, 1).fillEllipse(0, 20, 14, 11);
        mouthO.fillStyle(0xff7a8a, 1).fillEllipse(0, 23, 9, 5);
        head.add([face, capM, eyes, pupils, lids, mouthS, mouthO]);

        upper.add([torso, tag, armL, armR, head]);
        root.add([legL, legR, upper]);
        this.skp = { root, legL, legR, upper, armL, armR, head, eyes, pupils, lids, mouthS, mouthO };
      }

      shopkeeperTalk() {
        if (!this.sk) return;
        this.sk.talkUntil = this.time.now + 3800;
        const ic = this.add.text(this.sk.x, this.sk.y - 190, '💬', { fontSize: '26px' }).setOrigin(0.5).setDepth(100001);
        this.tweens.add({ targets: ic, y: ic.y - 26, alpha: 0, duration: 1300, ease: 'Sine.easeOut', onComplete: () => ic.destroy() });
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
          look = Math.sign(this.player.x - sk.x);       // stops and faces you
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

        sk.amp += ((moving ? 1 : 0) - sk.amp) * Math.min(1, delta / 90);
        if (moving) sk.phase += dt * Math.PI * 2 / 0.75;
        const s = Math.sin(sk.phase);
        const a = sk.amp;
        const rad = Phaser.Math.DegToRad;

        P.root.setPosition(sk.x, sk.y).setDepth(sk.y);
        this.skShadow.setPosition(sk.x, sk.y - 2).setDepth(sk.y - 1);
        this.skObst.x = sk.x - 24;
        this.skObst.y = sk.y - 8;

        P.legL.rotation = rad(24 * s * a);
        P.legR.rotation = rad(-24 * s * a);
        P.upper.y = -4 * Math.abs(s) * a + Math.sin(now / 480) * 1.3 * (1 - a);

        let lRot = 6 + 16 * s * a;
        let rRot = -6 + 16 * s * a;
        if (waving) rRot = -(140 + 18 * Math.sin(now / 80));
        else if (talking) { rRot = -(38 + 14 * Math.sin(now / 160)); lRot = 8 + 5 * Math.sin(now / 210); }
        P.armL.rotation = rad(lRot);
        P.armR.rotation = rad(rRot);

        P.head.rotation = rad(look * 3 + (talking ? Math.sin(now / 200) * 2 : 0));
        P.pupils.x = look * 2.4;
        if (now > sk.nextBlink) { sk.blinkUntil = now + 130; sk.nextBlink = now + 2000 + Math.random() * 3000; }
        const shut = now < sk.blinkUntil;
        P.eyes.setVisible(!shut);
        P.pupils.setVisible(!shut);
        P.lids.setVisible(shut);
        const open = waving || (talking && Math.floor(now / 140) % 2 === 0);
        P.mouthO.setVisible(open);
        P.mouthS.setVisible(!open);
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
          fontSize: '13px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3
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
          if (this.stepClock > 340) { this.stepClock = 0; SFX.step(); }
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
        this.player.setDepth(this.player.y);
        if (this.cartBox) this.updateCart();
        this.updateShopkeeper(delta);
        this.shadow.setPosition(this.player.x, this.player.y - 2).setDepth(this.player.y - 1);

        if (Phaser.Input.Keyboard.JustDown(k.SPACE)) grabBtn.click();

        const near = nearestProduct(this);
        const atCounter = !near && inCheckoutZone(this);
        if (atCounter && !S.zoneHint && S.basket.length > 0) {
          S.zoneHint = true;
          say('Ready to pay? Tap Checkout.');
        }
        const id = near ? near.item.id + (near.taken ? ':back' : '') : (atCounter ? '__counter' : '');
        if (id !== S.nearId) {
          S.nearId = id;
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
      height: VIEW_H,
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
    
