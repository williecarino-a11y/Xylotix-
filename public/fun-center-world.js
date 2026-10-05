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

  let originalStart = window.startMiimiidShop;
  let game = null;
  let phaserPromise = null;

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
      .mw-bubble { position: absolute; left: 10px; right: 10px; top: 10px; background: rgba(19, 26, 44, 0.92); border: 1px solid #232c42; color: #e6e9f0; border-radius: 14px; padding: 10px 12px; font-size: 14px; line-height: 1.35; pointer-events: none; z-index: 5; }
      .mw-overlay { position: absolute; inset: 0; background: rgba(8, 12, 24, 0.82); display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 8; }
      .mw-card { width: 100%; background: #131a2c; border: 1px solid #232c42; border-radius: 18px; padding: 16px; color: #e6e9f0; text-align: center; }
      .mw-card h3 { margin: 0 0 8px; color: #4da3ff; }
      .mw-card p { margin: 6px 0; font-size: 14px; }
      .mw-card button { margin-top: 8px; width: 100%; border: 0; border-radius: 999px; padding: 12px; font-weight: 800; background: #1f6feb; color: #fff; cursor: pointer; }
      .mw-card button.mw-alt { background: transparent; border: 1px solid #232c42; color: #9aa4bd; }
      .mw-opt { display: flex; justify-content: space-between; align-items: center; }
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
      if (p.taken || py < p.sy + 4) return;     // must stand in front of the shelf
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
      const shop = await miimiidFunCenterRequest('/api/fun-center/shop');
      const session = await miimiidFunCenterRequest('/api/fun-center/shop/session', {
        method: 'POST', body: JSON.stringify({})
      });
      mountWorld(content, shop, session);
    } catch (error) {
      console.error('Miimiid world failed, using the normal Mart:', error);
      if (typeof originalStart === 'function') originalStart();
    }
  }

  function destroyGame() {
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
      zoneHint: false
    };

    content.innerHTML = `
      <div class="mw">
        <div class="mw-top">
          <span class="mw-wallet">Wallet <span data-mw-wallet>$${S.budget}</span></span>
          <span class="mw-count">🛒 <span data-mw-count>0</span></span>
          <button type="button" class="mw-leave" data-mw-leave>Leave</button>
        </div>
        <div class="mw-holder" data-mw-holder>
          <div class="mw-bubble" data-mw-bubble>Welcome to Miimiid Mart! Use the stick to walk to a shelf.</div>
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
    function hud() {
      walletEl.textContent = `$${S.budget - S.spent}`;
      countEl.textContent = String(S.basket.length);
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
        if (typeof miimiidFunTone === 'function') miimiidFunTone(520, 0.05, 'sine', 0.025);
        await new Promise(r => setTimeout(r, 240));

        const result = await miimiidFunCenterRequest(
          `/api/fun-center/shop/session/${encodeURIComponent(S.sessionId)}/buy`,
          { method: 'POST', body: JSON.stringify({ itemId: item.id, optionId }) }
        );
        S.spent = result.spent;
        S.basket.push(item.id);
        product.taken = true;
        scene.flyToCart(product);
        hud();

        const left = result.remaining;
        let text = result.explanation || 'Added to the cart.';
        if (result.classification !== 'need') text += ' Do we really need this?';
        if (left <= 5) text += ` Whoa, only $${left} left!`;
        else if (left <= 10) text += ` $${left} left.`;
        say(text);
      } catch (error) {
        console.error('world buy error:', error);
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
        const needs = Array.isArray(r.needsBought) ? r.needsBought.length : 0;
        const o = overlay(`
          <h3>Trip finished!</h3>
          <p>Needs covered: <strong>${needs} / ${r.totalNeeds}</strong></p>
          <p>Spent $${r.spent} &middot; Left in wallet $${r.saved}</p>
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
      if (p) buyProduct(scene, p);
      else if (inCheckoutZone(scene)) doCheckout();
      else say('Walk up to a shelf to grab something, or to the counter to pay.');
    });

    // ---- the store ----
    class MartScene extends Phaser.Scene {
      constructor() { super('mart'); }

      preload() {
        this.load.image('art-floor', ART + 'floor.png');
        this.load.image('art-shelf', ART + 'shelf.png');
        this.load.image('art-counter', ART + 'counter.png');
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
        this.obst.push({ x: u.x, y: u.y + 108, w: UW, h: 32 });

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

        // floor
        const floorKey = this.textures.exists('art-floor') ? 'art-floor' : 'floor';
        const floorTiles = this.add.tileSprite(0, WALL_H, W, H - WALL_H, floorKey).setOrigin(0, 0).setDepth(-100);
        if (floorKey === 'art-floor') floorTiles.setTileScale(0.8);

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

        // player
        this.shadow = this.add.ellipse(START.x, START.y - 2, 90, 20, 0x000000, 0.28);
        this.player = this.add.image(START.x, START.y, 'pl-idle').setOrigin(0.5, 1);
        this.player.setScale(130 / Math.max(this.player.height, 1));

        this.arm = this.add.graphics().setDepth(99999);

        // camera
        const cam = this.cameras.main;
        cam.setBounds(0, 0, W, H);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(90, 60);
        cam.roundPixels = true;

        this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
      }

      reachAt(tx, ty) {
        const dir = this.faceLeft ? -1 : 1;
        const sx = this.player.x + dir * 40;
        const sy = this.player.y - 70;
        this.arm.clear();
        this.arm.lineStyle(9, 0xf1b27a, 1).lineBetween(sx, sy, tx, ty);
        this.arm.fillStyle(0xf1b27a, 1).fillCircle(tx, ty, 11);
        this.time.delayedCall(300, () => this.arm.clear());
      }

      flyToCart(product) {
        const dir = this.faceLeft ? -1 : 1;
        if (product.label) product.label.destroy();
        this.tweens.add({
          targets: product.obj,
          x: this.player.x + dir * 55,
          y: this.player.y - 45,
          scale: product.baseScale * 0.4,
          duration: 450,
          ease: 'Sine.easeInOut',
          onComplete: () => product.obj.destroy()
        });
      }

      update(time, delta) {
        if (!document.body.contains(holder)) { destroyGame(); return; }

        const dt = delta / 1000;
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

          this.walkClock += delta;
          if (this.walkClock > 260) {
            this.walkClock = 0;
            this.walkFlip = !this.walkFlip;
            this.player.setTexture(this.walkFlip ? 'pl-walk2' : 'pl-walk1');
          }
        } else {
          this.player.setTexture('pl-idle');
          this.walkClock = 0;
        }

        this.player.setFlipX(FACES_RIGHT ? this.faceLeft : !this.faceLeft);
        this.player.setDepth(this.player.y);
        this.shadow.setPosition(this.player.x, this.player.y - 2).setDepth(this.player.y - 1);

        if (Phaser.Input.Keyboard.JustDown(k.SPACE)) grabBtn.click();

        const near = nearestProduct(this);
        const atCounter = !near && inCheckoutZone(this);
        if (atCounter && !S.zoneHint && S.basket.length > 0) {
          S.zoneHint = true;
          say('Ready to pay? Tap Checkout.');
        }
        const id = near ? near.item.id : (atCounter ? '__counter' : '');
        if (id !== S.nearId) {
          S.nearId = id;
          this.products.forEach(p => { if (!p.taken) p.obj.setScale(p.baseScale * (p === near ? 1.2 : 1)); });
          if (near) { grabBtn.disabled = false; grabBtn.innerHTML = `✋ Grab<small>${esc(near.item.name)}</small>`; }
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
    
