/*
 * MIIMIID MART WORLD (prototype)
 * Phaser-based walkable store. Server routes are unchanged.
 * Turn on with ?world=1 on the site URL, off with ?world=0.
 */
(function () {
  'use strict';

  const PHASER_URL = '/vendor/phaser/phaser.min.js';
  const PHASER_CDN_FALLBACK = 'https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js';
  let WORLD_W = 1800;
  const WORLD_H = 900;
  const VIEW_W = 400;
  const VIEW_H = 520;
  const SPEED = 190;
  const FACES_RIGHT = true;        // set false if Miimiid walks backwards
  const CORRIDOR = { minX: 40, maxX: 1760, minY: 335, maxY: 650 };
  const OBSTACLES = [
    { x: 820, y: 440, w: 220, h: 50 },    // island shelf
    { x: 1590, y: 330, w: 190, h: 120 }   // checkout counter
  ];
  let COUNTER_X = 1560;
  // Where the walkable floor is inside your store artwork (fraction of its height).
  // If Miimiid walks on the shelves, raise FLOOR_TOP. If he can't reach the bottom, raise FLOOR_BOTTOM.
  const FLOOR_TOP = 0.66;
  const FLOOR_BOTTOM = 0.96;
  const GRAB_RANGE = 130;

  let originalStart = window.startMiimiidShop;
  let game = null;
  let phaserPromise = null;

  try {
    const q = new URLSearchParams(location.search).get('world');
    if (q === '1') localStorage.removeItem('miimiidWorld');
    if (q === '0') localStorage.setItem('miimiidWorld', '0');
  } catch (e) { /* ignore */ }

  // The new world is ON by default. Open the site with ?world=0 to use the old Mart.
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
    // Our own installed copy first, CDN only as a backup.
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

  // ---- product visuals: reuse the app's existing product art ----
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

  function hitsObstacle(x, y) {
    return OBSTACLES.some(o => x > o.x - 16 && x < o.x + o.w + 16 && y > o.y && y < o.y + o.h + 6);
  }

  // ---- main ----
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
      nearKind: null
    };

    content.innerHTML = `
      <div class="mw">
        <div class="mw-top">
          <span class="mw-wallet">Wallet <span data-mw-wallet>$${S.budget}</span></span>
          <span class="mw-count">🛒 <span data-mw-count>0</span></span>
          <button type="button" class="mw-leave" data-mw-leave>Leave</button>
        </div>
        <div class="mw-holder" data-mw-holder>
          <div class="mw-bubble" data-mw-bubble>Welcome to Miimiid Mart! Use the stick to walk.</div>
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

    // assets for Phaser
    const cartArt = MIIMIID_ASSETS.characters.miimiidCart;
    const plain = MIIMIID_ASSETS.characters.miimiid;
    const fallbackPose = plain[(window.MIIMIID_FUN_POSES && MIIMIID_FUN_POSES.happy) || 'happy'];
    const frames = {
      idle: (cartArt && cartArt.idle) || fallbackPose,
      walk1: (cartArt && cartArt.walk1) || fallbackPose,
      walk2: (cartArt && cartArt.walk2) || fallbackPose,
      happy: (cartArt && cartArt.happy) || fallbackPose
    };

    const items = shop.items.slice(0, 16);
    const sources = {};
    items.forEach(item => { sources[item.id] = productSource(item); });

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
        await new Promise(r => setTimeout(r, 220));

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

    function nearestProduct(scene) {
      const px = scene.player.x;
      const py = scene.player.y - 40;
      let best = null;
      let bd = GRAB_RANGE;
      scene.products.forEach(p => {
        if (p.taken) return;
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bd) { bd = d; best = p; }
      });
      return best;
    }

    grabBtn.addEventListener('click', () => {
      const scene = game && game.scene.getScene('mart');
      if (!scene || S.busy) return;
      const p = nearestProduct(scene);
      if (p) buyProduct(scene, p);
      else if (scene.player.x > COUNTER_X) doCheckout();
    });

    // ---- Phaser scene ----
    class MartScene extends Phaser.Scene {
      constructor() { super('mart'); }

      preload() {
        const bgUrl = MIIMIID_ASSETS.game && MIIMIID_ASSETS.game.martInterior;
        if (bgUrl) this.load.image('mart-bg', bgUrl);
        Object.keys(frames).forEach(k => this.load.image(`pl-${k}`, frames[k]));
        items.forEach(item => {
          const src = sources[item.id];
          if (src.src) this.load.image(`pr-${item.id}`, src.src);
        });
      }

      create() {
        this.products = [];
        this.faceLeft = false;
        this.walkFlip = false;
        this.walkClock = 0;

        const hasBg = this.textures.exists('mart-bg');

        if (hasBg) {
          // Your beautiful Miimiid Mart artwork becomes the world.
          const bg = this.add.image(0, 0, 'mart-bg').setOrigin(0, 0).setDepth(-100);
          bg.setScale(WORLD_H / bg.height);
          WORLD_W = Math.round(bg.displayWidth);
          CORRIDOR.minX = 60;
          CORRIDOR.maxX = WORLD_W - 60;
          CORRIDOR.minY = Math.round(WORLD_H * FLOOR_TOP);
          CORRIDOR.maxY = Math.round(WORLD_H * FLOOR_BOTTOM);
          OBSTACLES.length = 0;
          COUNTER_X = Math.round(WORLD_W * 0.78);
        } else {
          // Backup look if the artwork can't load.
          const g = this.add.graphics().setDepth(-100);
          g.fillStyle(0x17203a, 1).fillRect(0, 0, WORLD_W, WORLD_H);
          g.fillStyle(0x1f2a4d, 1).fillRect(0, 300, WORLD_W, WORLD_H - 300);
          g.lineStyle(1, 0x2b3862, 0.7);
          for (let x = 0; x <= WORLD_W; x += 100) g.lineBetween(x, 300, x, WORLD_H);
          for (let y = 300; y <= WORLD_H; y += 100) g.lineBetween(0, y, WORLD_W, y);
          this.add.text(WORLD_W / 2, 40, 'MIIMIID MART', { fontSize: '34px', color: '#4da3ff', fontStyle: 'bold' })
            .setOrigin(0.5).setDepth(-50);
          this.drawShelf(130, 150, 1500, 120);
          this.drawShelf(130, 660, 1500, 130);
          OBSTACLES.forEach((o, i) => {
            const gg = this.add.graphics().setDepth(o.y + o.h);
            gg.fillStyle(i === 0 ? 0x7a5a3a : 0x2d6a4f, 1).fillRoundedRect(o.x, o.y, o.w, o.h + 6, 10);
            gg.fillStyle(0xffffff, 0.12).fillRect(o.x, o.y, o.w, 8);
            if (i === 1) this.add.text(o.x + o.w / 2, o.y + 40, 'CHECKOUT', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(o.y + o.h + 1);
          });
        }

        // products: on wooden display crates in two rows on the store floor
        items.forEach((item, i) => {
          let x;
          let y;
          let depth;
          let labelY;
          if (hasBg) {
            const cols = Math.ceil(items.length / 2);
            const row = i % 2;
            const col = Math.floor(i / 2);
            x = 130 + col * ((WORLD_W - 260) / Math.max(cols - 1, 1));
            const crateY = Math.round(WORLD_H * (row === 0 ? 0.72 : 0.89));
            const crate = this.add.graphics().setDepth(crateY);
            crate.fillStyle(0x7a5a3a, 1).fillRoundedRect(x - 42, crateY - 6, 84, 30, 6);
            crate.fillStyle(0xffffff, 0.15).fillRect(x - 42, crateY - 6, 84, 6);
            depth = crateY + 1;
            y = crateY - 36;
            labelY = crateY + 28;
          } else {
            const top = i < 8;
            const slot = top ? i : i - 8;
            x = 150 + slot * 190;
            y = top ? 225 : 705;
            depth = top ? 275 : 795;
            labelY = y + 38;
          }
          const src = sources[item.id];
          let obj;
          if (src.src) {
            obj = this.add.image(x, y, `pr-${item.id}`);
            obj.setScale(56 / Math.max(obj.height, 1));
          } else {
            obj = this.add.text(x, y, src.emoji, { fontSize: '44px' }).setOrigin(0.5);
          }
          obj.setDepth(depth);
          const label = this.add.text(x, labelY, `${item.name}\n${priceText(item)}`, {
            fontSize: '13px', color: '#ffffff', align: 'center', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4
          }).setOrigin(0.5, 0).setDepth(depth);
          this.products.push({ item, obj, label, x, y, taken: false, baseScale: obj.scaleX });
        });

        // player
        const startY = hasBg ? Math.round(WORLD_H * 0.8) : 480;
        this.shadow = this.add.ellipse(220, startY, 90, 20, 0x000000, 0.35);
        this.player = this.add.image(220, startY, 'pl-idle').setOrigin(0.5, 1);
        this.player.setScale(130 / Math.max(this.player.height, 1));

        this.arm = this.add.graphics().setDepth(99999);

        // camera
        const cam = this.cameras.main;
        cam.setBounds(0, 0, WORLD_W, WORLD_H);
        cam.startFollow(this.player, true, 0.12, 0.12);
        cam.setDeadzone(110, 70);

        this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
      }

      drawShelf(x, y, w, h) {
        const g = this.add.graphics().setDepth(y + h);
        g.fillStyle(0x3a2e24, 1).fillRoundedRect(x, y, w, h, 10);
        g.fillStyle(0x7a5a3a, 1).fillRect(x, y + h - 14, w, 14);
        g.fillStyle(0x7a5a3a, 1).fillRect(x, y + 38, w, 8);
      }

      reachAt(tx, ty) {
        const dir = this.faceLeft ? -1 : 1;
        const sx = this.player.x + dir * 40;
        const sy = this.player.y - 70;
        this.arm.clear();
        this.arm.lineStyle(9, 0xf1b27a, 1).lineBetween(sx, sy, tx, ty);
        this.arm.fillStyle(0xf1b27a, 1).fillCircle(tx, ty, 11);
        this.time.delayedCall(280, () => this.arm.clear());
      }

      flyToCart(product) {
        const dir = this.faceLeft ? -1 : 1;
        if (product.label) product.label.destroy();
        this.tweens.add({
          targets: product.obj,
          x: this.player.x + dir * 55,
          y: this.player.y - 50,
          scale: product.baseScale * 0.4,
          duration: 450,
          ease: 'Sine.easeInOut',
          onComplete: () => product.obj.destroy()
        });
      }

      update(time, delta) {
        // stop if the player left the Fun Center
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
          let nx = Phaser.Math.Clamp(this.player.x + ix * SPEED * dt, CORRIDOR.minX, CORRIDOR.maxX);
          if (hitsObstacle(nx, this.player.y)) nx = this.player.x;
          let ny = Phaser.Math.Clamp(this.player.y + iy * SPEED * 0.75 * dt, CORRIDOR.minY, CORRIDOR.maxY);
          if (hitsObstacle(nx, ny)) ny = this.player.y;
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
        this.shadow.setPosition(this.player.x, this.player.y - 4).setDepth(this.player.y - 1);

        // keyboard grab
        if (Phaser.Input.Keyboard.JustDown(k.SPACE)) grabBtn.click();

        // nearest product highlight + Grab button
        const near = nearestProduct(this);
        const atCounter = !near && this.player.x > COUNTER_X;
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
