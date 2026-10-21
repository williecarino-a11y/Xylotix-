/*
 * MIIMIID MART POLISH
 * Visual-only extras for the Mart. Nothing here can be grabbed or bought,
 * and nothing blocks the player. Called once from fun-center-world.js after the shelves are built.
 *   1. Fills every empty spot on the shelves and fridges with stock.
 *   2. Puts a soft glow under the products you can really grab, so they stand out from the stock.
 *   3. Removes the square tap highlight behind the Grab / Scan buttons.
 *   4. Makes the sale / streak banners at the top smaller, so the store sign stays visible.
 *   5. Adds life to the empty floor: plants that sway, a basket stack and a restock pallet by the walls.
 *   6. Calmer top bar with its own strip above the store view, banners that stack below it, and a smooth floating joystick (MiimiidMartControls).
 * 7. Starts public/mart-wow.js (atmosphere, mood and reward moments) if it is loaded.
 * If anything fails, the store simply looks as it did before.
 */
(function () {
  'use strict';

  var BASE = '/assets/fun-center/products/';
  // Extra product pictures that already exist in the repo but are not part of the weekly shop.
  var EXTRAS = {
    fresh: ['banana', 'tomato'],
    dairy: ['yogurt', 'cheese'],
    snacks: ['sugar']
  };
  // Colors for the plain boxes, bags and cartons that fill the rest.
  var PALETTES = {
    fresh:   [[0x3fa66b, 0x2a7a4e], [0xe8772e, 0xb85a1c], [0xd94f4f, 0xa63636], [0xf2c14e, 0xc79a2e]],
    snacks:  [[0xe0245e, 0xa8173f], [0xf2c14e, 0xc79a2e], [0x7a4de0, 0x5733b0], [0x2fa8e0, 0x1d7aa8]],
    care:    [[0xf4f8ff, 0xb9c7e0], [0x7ab8ff, 0x4d86d1], [0x9be3c1, 0x5fb896], [0xffd1dc, 0xd89aab]],
    fun:     [[0x23407a, 0x142650], [0x7a4de0, 0x5733b0], [0x1f6feb, 0x1450b0], [0xe0245e, 0xa8173f]],
    dairy:   [[0xf4f8ff, 0xb9c7e0], [0xcfe8ff, 0x8fb8e0], [0xfff3c4, 0xd9c27a], [0xe3f6ea, 0x9bc9ae]],
    freezer: [[0x9fd8f5, 0x5faed6], [0xf4f8ff, 0xb9c7e0], [0xe0245e, 0xa8173f], [0xf2c14e, 0xc79a2e]]
  };

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // draws one plain package once and keeps it as a texture
  function packageTexture(scene, key, w, h, main, shade, kind) {
    if (scene.textures.exists(key)) return;
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    if (kind === 'bag') {
      g.fillStyle(shade, 1).fillRoundedRect(0, 0, w, h, 4);
      g.fillStyle(main, 1).fillRoundedRect(1, 3, w - 2, h - 5, 4);
      g.fillStyle(0xffffff, 0.85).fillRoundedRect(4, h * 0.38, w - 8, h * 0.26, 3);
    } else if (kind === 'carton') {
      g.fillStyle(shade, 1).fillRoundedRect(0, 0, w, h, 3);
      g.fillStyle(main, 1).fillRoundedRect(1, 5, w - 2, h - 6, 3);
      g.fillStyle(shade, 1).fillTriangle(0, 5, w / 2, 0, w, 5);
      g.fillStyle(0xffffff, 0.7).fillRect(4, h * 0.45, w - 8, 5);
    } else {
      g.fillStyle(shade, 1).fillRoundedRect(0, 0, w, h, 3);
      g.fillStyle(main, 1).fillRoundedRect(1, 1, w - 2, h - 4, 3);
      g.fillStyle(shade, 0.55).fillRect(1, 1, w - 2, 5);
      g.fillStyle(0xffffff, 0.8).fillRoundedRect(4, h * 0.42, w - 8, h * 0.24, 2);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  function build(scene, ctx, extraKeys) {
    var UNITS = ctx.UNITS, UW = ctx.UW, UH = ctx.UH, itemsByCat = ctx.itemsByCat || {};
    var count = 0;

    UNITS.forEach(function (u, ui) {
      var fridge = !!u.fridge;
      var boards = fridge ? [u.y + 72, u.y + 112] : [u.y + 52, u.y + 82, u.y + 112];
      var depth = u.y + UH + 0.6;      // above the shelf, below the real products
      var list = itemsByCat[u.id] || [];
      var pal = PALETTES[u.id] || PALETTES.fun;
      var pics = (EXTRAS[u.id] || []).filter(function (k) { return extraKeys[k]; });
      var rand = rng(1000 + ui * 77);

      // where the real products stand on this unit, so the stock never hides them
      var real = boards.map(function () { return []; });
      list.forEach(function (item, i) {
        real[i % boards.length].push(u.x + (UW / (list.length + 1)) * (i + 1));
      });

      boards.forEach(function (baseY, b) {
        var slots = 6;
        var left = u.x + (fridge ? 26 : 22);
        var right = u.x + UW - (fridge ? 26 : 22);
        var step = (right - left) / (slots - 1);
        var targetH = fridge ? 26 : (b === 0 ? 22 : 25);
        for (var s = 0; s < slots; s++) {
          var x = left + s * step + (rand() - 0.5) * 4;
          var blocked = real[b].some(function (rx) { return Math.abs(rx - x) < 38; });
          if (blocked) continue;

          var obj;
          var usePic = pics.length > 0 && rand() < 0.45;
          if (usePic) {
            var key = 'pf-' + pics[Math.floor(rand() * pics.length)];
            obj = scene.add.image(x, baseY, key).setOrigin(0.5, 1);
            obj.setScale(targetH / Math.max(obj.height, 1));
          } else {
            var p = pal[Math.floor(rand() * pal.length)];
            var kind = fridge ? 'carton' : (rand() < 0.5 ? 'bag' : 'box');
            var w = 16 + Math.floor(rand() * 7);
            var h = targetH - 2 + Math.floor(rand() * 5);
            var tkey = 'pk-' + kind + '-' + p[0].toString(16) + '-' + w + 'x' + h;
            packageTexture(scene, tkey, w, h, p[0], p[1], kind);
            obj = scene.add.image(x, baseY, tkey).setOrigin(0.5, 1);
          }
          obj.setDepth(depth).setTint(0xdfe5f2);
          count++;
        }
      });
    });
    return count;
  }


  // ---------- props along the walls (they sit in the empty margins and block a little, like real furniture) ----------
  function plantTexture(scene) {
    if (scene.textures.exists('pp-plant')) return;
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x23805a, 1);
    g.fillTriangle(24, 62, 32, 62, 4, 22).fillTriangle(24, 62, 34, 62, 14, 4);
    g.fillStyle(0x2f9e6b, 1);
    g.fillTriangle(22, 62, 36, 62, 28, 0).fillTriangle(26, 62, 38, 62, 48, 10);
    g.fillStyle(0x3fb97f, 1);
    g.fillTriangle(28, 62, 40, 62, 56, 28).fillTriangle(20, 62, 30, 62, 8, 38);
    g.fillStyle(0xb5654a, 1).fillTriangle(14, 94, 42, 94, 10, 66).fillTriangle(42, 94, 46, 66, 10, 66);
    g.fillStyle(0xc9755a, 1).fillRoundedRect(8, 58, 40, 10, 3);
    g.fillStyle(0x000000, 0.12).fillRect(14, 82, 28, 3);
    g.generateTexture('pp-plant', 56, 94);
    g.destroy();
  }

  function basketTexture(scene) {
    if (scene.textures.exists('pp-baskets')) return;
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    var cols = [0xe0245e, 0xc41d52, 0xe0245e, 0xc41d52];
    for (var i = 0; i < 4; i++) {
      var y = 34 - i * 8;
      g.fillStyle(cols[i], 1).fillRoundedRect(2 + i, y, 40 - i * 2, 12, 3);
      g.fillStyle(0xff6f98, 1).fillRoundedRect(2 + i, y, 40 - i * 2, 3, 2);
      g.lineStyle(1, 0x7a0f30, 0.5);
      for (var x = 8 + i; x < 38 - i; x += 6) g.lineBetween(x, y + 4, x, y + 10);
    }
    g.generateTexture('pp-baskets', 46, 48);
    g.destroy();
  }

  function palletTexture(scene) {
    if (scene.textures.exists('pp-pallet')) return;
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    // pallet
    g.fillStyle(0x8a6a44, 1).fillRect(2, 66, 82, 5).fillRect(2, 73, 82, 5);
    g.fillStyle(0x6b4f2f, 1).fillRect(6, 71, 10, 3).fillRect(38, 71, 10, 3).fillRect(70, 71, 10, 3);
    // boxes
    g.fillStyle(0xc9a06a, 1).fillRoundedRect(4, 42, 36, 24, 2).fillRoundedRect(44, 42, 36, 24, 2).fillRoundedRect(22, 20, 40, 22, 2);
    g.fillStyle(0xdcb682, 1).fillRect(4, 42, 36, 4).fillRect(44, 42, 36, 4).fillRect(22, 20, 40, 4);
    g.fillStyle(0xe8d3a8, 1).fillRect(20, 42, 4, 24).fillRect(60, 42, 4, 24).fillRect(40, 20, 4, 22);
    g.fillStyle(0x1f6feb, 1).fillRoundedRect(10, 52, 12, 8, 2).fillRoundedRect(50, 52, 12, 8, 2).fillRoundedRect(46, 29, 12, 8, 2);
    g.generateTexture('pp-pallet', 86, 80);
    g.destroy();
  }

  function addProp(scene, key, x, y, w, obstacle, sway) {
    // soft shadow first, then the prop (depth follows its feet, so Miimiid walks in front or behind correctly)
    if (scene.textures.exists('softshadow')) {
      scene.add.image(x, y - 2, 'softshadow').setDisplaySize(w * 1.2, 20).setDepth(y - 1);
    }
    var img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    if (obstacle && scene.obst) scene.obst.push(obstacle);
    if (sway && scene.tweens) {
      scene.tweens.add({
        targets: img, angle: { from: -1.1, to: 1.1 }, duration: 2600 + Math.random() * 1200,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }
    return img;
  }

  function addProps(scene) {
    plantTexture(scene);
    basketTexture(scene);
    palletTexture(scene);
    addProp(scene, 'pp-plant', 66, 760, 56, { x: 38, y: 738, w: 56, h: 24 }, true);
    addProp(scene, 'pp-baskets', 66, 396, 46, { x: 40, y: 380, w: 50, h: 18 }, false);
    addProp(scene, 'pp-pallet', 1316, 336, 86, { x: 1274, y: 314, w: 86, h: 24 }, false);
    addProp(scene, 'pp-plant', 1322, 486, 56, { x: 1294, y: 464, w: 56, h: 24 }, true);
  }

  // a soft glow under every product you can really grab
  function markReal(scene) {
    if (!scene.textures.exists('glow')) return;
    var marks = (scene.products || []).map(function (p) {
      var o = p.obj;
      var g = scene.add.image(o.x, o.y - o.displayHeight * 0.5, 'glow')
        .setDisplaySize(66, 58).setTint(0xfff0a8).setAlpha(0.6).setDepth(o.depth - 0.2);
      return { p: p, g: g };
    });
    scene.events.on('update', function () {
      marks.forEach(function (m) {
        var show = !m.p.taken && (!m.p.fridge || m.p.fridge.open);
        if (m.g.visible !== show) m.g.setVisible(show);
      });
    });
  }

  function decorate(scene, ctx) {
    try {
      // the top bar gets its own strip: the store view starts below it, so nothing hides the neon sign
      try { reserveHud(scene); } catch (e) { console.error('mart hud strip failed:', e); }
      // at the start the camera is pressed against the bottom of the store; nudge it up so the whole neon sign shows
      try {
        scene.events.once('update', function () {
          var c = scene.cameras && scene.cameras.main;
          if (c && c.followOffset && c.followOffset.set) c.followOffset.set(0, 60);
        });
      } catch (e) {}
      try { markReal(scene); } catch (e) { console.error('mart glow failed:', e); }
      try { addProps(scene); } catch (e) { console.error('mart props failed:', e); }
      // atmosphere, mood and reward moments live in mart-wow.js
      try { if (window.MiimiidMartWow) window.MiimiidMartWow.start(scene, ctx); } catch (e) { console.error('mart wow failed:', e); }
      // make sure the extra pictures are loaded, then build
      var extraKeys = {};
      var toLoad = [];
      Object.keys(EXTRAS).forEach(function (cat) {
        EXTRAS[cat].forEach(function (name) {
          var key = 'pf-' + name;
          if (scene.textures.exists(key)) { extraKeys[name] = true; return; }
          if (toLoad.indexOf(name) === -1) toLoad.push(name);
        });
      });

      if (!toLoad.length) { build(scene, ctx, extraKeys); return; }

      toLoad.forEach(function (name) { scene.load.image('pf-' + name, BASE + name + '.png'); });
      scene.load.once('complete', function () {
        try {
          toLoad.forEach(function (name) { if (scene.textures.exists('pf-' + name)) extraKeys[name] = true; });
          build(scene, ctx, extraKeys);
        } catch (e) { console.error('mart polish build failed:', e); }
      });
      scene.load.start();
    } catch (e) {
      console.error('mart polish failed:', e);
    }
  }

  // no square tap highlight behind the round buttons
  function styles() {
    if (document.getElementById('mart-polish-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-polish-css';
    st.textContent =
      '.mw-grab, .mw-scan, .mw-leave, .mw-joy { -webkit-tap-highlight-color: transparent; }' +
      '.mw-grab:focus, .mw-scan:focus, .mw-leave:focus { outline: none; }' +
      // calmer top bar: one soft, slim glass look instead of heavy dark blocks, so the store sign shows through
      '.mw .mw-hud { gap: 3px 5px !important; top: calc(6px + env(safe-area-inset-top, 0px)) !important; }' +
      '.mw .mw-hud .mw-top .mw-wallet, .mw .mw-hud .mw-top .mw-count, .mw .mw-hud .mw-top .mw-leave, .mw .mw-hud .mw-top .mw-clock,' +
      ' .mw .mw-hud .mm-meters .mm-meter, .mw .mw-hud .mw-list details { background: rgba(8, 14, 30, 0.5) !important; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); border: 0 !important; box-shadow: none !important; }' +
      '.mw .mw-hud .mw-top .mw-wallet { font-size: 12px !important; padding: 3px 10px !important; }' +
      '.mw .mw-hud .mw-top .mw-count, .mw .mw-hud .mw-top .mw-leave { font-size: 11px !important; padding: 3px 9px !important; }' +
      '.mw .mw-hud .mw-clock { padding: 3px 9px !important; }' +
      '.mw .mw-hud .mw-clock-bar { height: 4px !important; }' +
      '.mw .mw-hud .mm-meters .mm-meter { padding: 2px 7px 6px !important; font-size: 9px !important; }' +
      '.mw .mw-hud .mw-list details { padding: 2px 8px !important; }' +
      '.mw .mw-hud > .mw-top { order: 0 !important; }' +
      '.mw .mw-hud > .mm-meters { order: 1 !important; }' +
      '.mw .mw-hud > .mw-list { order: 2 !important; }' +
      '.mw .mw-hud > :not(.mw-top):not(.mm-meters):not(.mw-list) { order: 5 !important; flex: 0 0 76% !important; margin: 0 12% !important; box-sizing: border-box; text-align: center; font-size: 10px !important; padding: 2px 9px !important; line-height: 1.25; animation: none !important; opacity: .95; }' +
      // top bar, round 2: tighter, and the meters row loses its pills so the sign and shelves read clearly
      '.mw .mw-hud { top: calc(4px + env(safe-area-inset-top, 0px)) !important; gap: 2px 5px !important; }' +
      '.mw .mw-hud .mw-clock span { font-size: 9px !important; opacity: .85; }' +
      '.mw .mw-hud .mw-clock-bar { height: 3px !important; }' +
      '.mw .mw-hud .mm-meters .mm-meter { background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; padding: 0 6px 5px !important; text-shadow: 0 1px 3px rgba(0,0,0,.95); }' +
      '.mw .mw-hud .mm-meters .mm-meter-bar { height: 2px !important; bottom: 1px !important; }' +
      '.mw .mw-hud .mw-list details { background: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; text-shadow: 0 1px 3px rgba(0,0,0,.95); }' +
      // joystick: floating ring, bigger, eased (see attachStick)
      '.mw-controls { position: relative; }' +
      '.mw-joypad { position: absolute; left: 0; top: -28px; bottom: 0; width: 46%; touch-action: none; z-index: 1; -webkit-tap-highlight-color: transparent; }' +
      '.mw-scan, .mw-grab { position: relative; z-index: 3; }' +
      // bottom messages: one calm dark card for Sam, and the small status line hides while Sam is talking
      '.mw .mw-asst { top: auto !important; bottom: 10px !important; left: 10px !important; right: 10px !important; background: rgba(8, 14, 30, 0.86) !important; border: 1px solid rgba(95, 211, 160, 0.55) !important; color: #e6e9f0 !important; border-radius: 14px !important; padding: 7px 11px !important; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }' +
      '.mw .mw-asst b { color: #5fd3a0 !important; }' +
      '.mw .mw-asst-face { background: #2f9e6b !important; color: #fff !important; }' +
      '.mw .mw-reply { background: transparent !important; border: 1px solid #5fd3a0 !important; color: #b4f0d3 !important; padding: 5px 11px !important; }' +
      '.mw .mw-reply:active { background: #2f9e6b !important; color: #fff !important; }' +
      '.mw .mw-asst.show ~ .mw-bubble { opacity: 0 !important; }' +
      '.mw .mw-bubble { bottom: 10px !important; background: rgba(8, 14, 30, 0.78) !important; }' +
      '.mw-joy.mw-joy-float { width: 124px; height: 124px; pointer-events: none; opacity: .6; background: rgba(77, 163, 255, 0.10); transition: transform .16s ease-out, opacity .2s; }' +
      '.mw-joy.mw-joy-float.on { opacity: 1; background: rgba(77, 163, 255, 0.16); transition: opacity .12s; }' +
      '.mw-joy-float .mw-joy-knob { width: 52px; height: 52px; margin: -26px 0 0 -26px; transition: none !important; background: radial-gradient(circle at 35% 30%, #5aa2ff, #1f6feb 70%); box-shadow: 0 4px 14px rgba(0,0,0,.45), 0 0 14px rgba(77,163,255,.35); }';
    document.head.appendChild(st);
  }
  try { styles(); } catch (e) {}



  // ---------- top bar strip: the camera only draws below the top bar ----------
  function reserveHud(scene) {
    var cam = scene.cameras && scene.cameras.main;
    if (!cam || !cam.setViewport) return;
    var applied = 0;
    function measure() {
      try {
        var hud = document.querySelector('.mw-hud');
        var canvas = scene.sys && scene.sys.game && scene.sys.game.canvas;
        if (!hud || !canvas || !scene.scale || !scene.scale.gameSize) return;
        var cr = canvas.getBoundingClientRect();
        if (!cr.height) return;
        var bottom = 0;
        ['.mw-top', '.mm-meters'].forEach(function (sel) {
          var el = hud.querySelector(':scope > ' + sel);
          if (!el) return;
          var r = el.getBoundingClientRect();
          if (r.height) bottom = Math.max(bottom, r.bottom);
        });
        if (!bottom) return;
        var gh = scene.scale.gameSize.height, gw = scene.scale.gameSize.width;
        var px = Math.round((bottom - cr.top + 3) * gh / cr.height);
        px = Math.max(0, Math.min(px, Math.round(gh * 0.2)));
        if (Math.abs(px - applied) < 3) return;
        applied = px;
        cam.setViewport(0, px, gw, gh - px);
      } catch (e) {}
    }
    function stackBanners() {
      try {
        var hud = document.querySelector('.mw-hud');
        if (!hud) return;
        var base = 0;
        ['.mw-top', '.mm-meters'].forEach(function (sel) {
          var el = hud.querySelector(':scope > ' + sel);
          if (el && el.offsetHeight) base = Math.max(base, el.offsetTop + el.offsetHeight);
        });
        var y = base + 3;
        Array.prototype.forEach.call(hud.children, function (el) {
          if (el.matches('.mw-top, .mm-meters, .mw-list')) return;
          if (!el.offsetHeight) return;                    // hidden banners take no space
          el.style.top = y + 'px';
          y += el.offsetHeight + 3;
        });
      } catch (e) {}
    }
    scene.events.once('update', measure);
    if (scene.time && scene.time.addEvent) scene.time.addEvent({ delay: 200, loop: true, callback: function () { measure(); stackBanners(); } });
    window.addEventListener('resize', measure);
  }

  // ---------- joystick: floating ring under your thumb, longer travel, soft start and stop ----------
  function attachStick(joyEl, knob, ctl) {
    try {
      var zone = joyEl && joyEl.parentNode;
      if (!zone || !knob || !ctl) return false;
      if (joyEl.getAttribute('data-stick')) return true;
      joyEl.setAttribute('data-stick', '1');
      var pad = document.createElement('div');
      pad.className = 'mw-joypad';
      zone.insertBefore(pad, zone.firstChild);
      joyEl.classList.add('mw-joy-float');

      var R = 54, DEAD = 0.1, CURVE = 1.35;
      var target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
      var raf = 0, activeId = null, cx = 0, cy = 0;

      function clamp(v, lo, hi) { return hi < lo ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)); }

      function loop() {
        raf = 0;
        var tm = Math.hypot(target.x, target.y), cm = Math.hypot(cur.x, cur.y);
        var f = tm >= cm ? 0.34 : 0.55;          // gentle start, quicker stop
        cur.x += (target.x - cur.x) * f;
        cur.y += (target.y - cur.y) * f;
        if (tm === 0 && Math.hypot(cur.x, cur.y) < 0.03) { cur.x = 0; cur.y = 0; }
        ctl.x = cur.x; ctl.y = cur.y;
        if (tm !== 0 || cur.x !== 0 || cur.y !== 0) raf = requestAnimationFrame(loop);
      }
      function kick() { if (!raf) raf = requestAnimationFrame(loop); }

      function place(e) {
        joyEl.style.transform = '';
        var home = joyEl.getBoundingClientRect();
        var hx = home.left + home.width / 2, hy = home.top + home.height / 2;
        var pr = pad.getBoundingClientRect();
        var half = home.width / 2;
        cx = clamp(e.clientX, pr.left + half, pr.right - half);
        cy = clamp(e.clientY, pr.top + half + 28, pr.bottom - half);
        joyEl.style.transform = 'translate(' + (cx - hx) + 'px,' + (cy - hy) + 'px)';
      }

      function move(e) {
        var dx = e.clientX - cx, dy = e.clientY - cy;
        var len = Math.hypot(dx, dy);
        var k = len > R ? R / len : 1;
        knob.style.transform = 'translate(' + (dx * k) + 'px,' + (dy * k) + 'px)';
        var v = Math.min(1, len / R);
        if (v < DEAD) { target.x = 0; target.y = 0; kick(); return; }
        var m = Math.pow((v - DEAD) / (1 - DEAD), CURVE);   // small pushes = slow and precise
        target.x = (dx / len) * m;
        target.y = (dy / len) * m;
        kick();
      }

      function end(e) {
        if (e && activeId !== null && e.pointerId !== undefined && e.pointerId !== activeId) return;
        activeId = null;
        target.x = 0; target.y = 0;
        knob.style.transform = '';
        joyEl.style.transform = '';
        joyEl.classList.remove('on');
        kick();
      }

      pad.addEventListener('pointerdown', function (e) {
        if (activeId !== null) return;
        activeId = e.pointerId;
        try { pad.setPointerCapture(e.pointerId); } catch (err) {}
        place(e);
        joyEl.classList.add('on');
        move(e);
        try { if (navigator.vibrate) navigator.vibrate(6); } catch (err) {}
        e.preventDefault();
      });
      pad.addEventListener('pointermove', function (e) { if (e.pointerId === activeId) { move(e); e.preventDefault(); } });
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
      pad.addEventListener('lostpointercapture', end);
      pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      return true;
    } catch (e) {
      console.error('mart joystick failed:', e);
      return false;
    }
  }

  window.MiimiidMartControls = { attach: attachStick };
  window.MiimiidMartPolish = { decorate: decorate };
})();
