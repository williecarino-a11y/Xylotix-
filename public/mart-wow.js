/*
 * MIIMIID MART WOW
 * Atmosphere and reward moments for the Mart. Visual only: it never changes prices, items or scores.
 * Started once from mart-polish.js (MiimiidMartWow.start) after the store is built.
 *   1. "Lights on" opening: the store flickers on like a real shop, then settles.
 *   2. A mood that follows the closing clock: bright and clean at the start, golden hour as closing nears.
 *   3. Soft screen edges that react: green while your smart streak is alive, red when money is under $5 or time is nearly up,
 *      gold when your list is complete.
 *   4. A slow sunbeam that drifts across the screen and across the glossy floor.
 *   5. A cool rim of light under Miimiid so the character pops, and a clean ring at every pickup.
 *   6. When the list is complete: a chime and a golden beacon on the checkout area.
 *   7. A more premium look for the buttons and the trip result card.
 *   8. Flash sale: a siren edge and a spotlight on the discounted product. Closing time: the counter lights up. A green sparkle trail while your streak lives.
 * If anything fails, the store simply looks as it did before.
 */
(function () {
  'use strict';

  var CHECKOUT = { x: 1150, y: 830 };   // centre of the pay area (matches ZONE in fun-center-world.js)

  // ---------- styles ----------
  function styles() {
    if (document.getElementById('mart-wow-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-wow-css';
    st.textContent =
      '.mw-atmo { position: absolute; inset: 0; z-index: 5; pointer-events: none; overflow: hidden; border-radius: inherit; --warm: 0; --vig: .26; --vig2: .09; }' +
      '.mw-atmo-grade { position: absolute; inset: 0; transition: background .6s linear;' +
      '  background: radial-gradient(ellipse 78% 64% at 50% 46%, rgba(3,7,18,0) 0%, rgba(3,7,18,var(--vig2)) 62%, rgba(3,7,18,var(--vig)) 100%),' +
      '              linear-gradient(rgba(255,176,80,var(--warm)), rgba(255,160,70,var(--warm))); }' +
      '.mw-atmo-edge { position: absolute; inset: 0; opacity: 0; transition: opacity .6s ease; border-radius: inherit; }' +
      '.mw-atmo.streak .mw-atmo-edge.e-streak { opacity: 1; animation: mwEdgeBreath 2.4s ease-in-out infinite; box-shadow: inset 0 0 56px 2px rgba(63,214,140,.2); }' +
      '.mw-atmo.tight .mw-atmo-edge.e-tight { opacity: 1; animation: mwEdgeBreath 1.3s ease-in-out infinite; box-shadow: inset 0 0 54px 2px rgba(255,84,84,.22); }' +
      '.mw-atmo.done .mw-atmo-edge.e-done { opacity: 1; animation: mwEdgeBreath 1.8s ease-in-out infinite; box-shadow: inset 0 0 64px 4px rgba(255,205,90,.28); }' +
      '.mw-atmo.sale .mw-atmo-edge.e-sale { opacity: 1; animation: mwEdgeBreath .9s ease-in-out infinite; box-shadow: inset 0 0 60px 4px rgba(255,92,70,.4); }' +
      '@keyframes mwEdgeBreath { 0%, 100% { filter: brightness(.7); } 50% { filter: brightness(1.15); } }' +
      '.mw-atmo-sweep { position: absolute; top: -10%; bottom: -10%; left: -60%; width: 55%; transform: translateX(0) skewX(-16deg);' +
      '  background: linear-gradient(90deg, rgba(255,246,220,0) 0%, rgba(255,246,220,.075) 50%, rgba(255,246,220,0) 100%);' +
      '  animation: mwSweep 12s ease-in-out infinite; }' +
      '@keyframes mwSweep { 0%, 15% { transform: translateX(0) skewX(-16deg); opacity: 0; } 25% { opacity: 1; } 70% { opacity: 1; } 85%, 100% { transform: translateX(340%) skewX(-16deg); opacity: 0; } }' +
      '.mw-atmo-intro { position: absolute; inset: 0; background: #04081a; opacity: 0; animation: mwLightsOn 1.7s ease-out forwards; }' +
      '@keyframes mwLightsOn { 0% { opacity: 1; } 14% { opacity: .62; } 22% { opacity: .95; } 36% { opacity: .38; } 46% { opacity: .72; } 62% { opacity: .2; } 100% { opacity: 0; } }' +
      // buttons: an active Grab breathes softly so you know it is ready
      '.mw-grab:not(:disabled) { animation: mwGrabGlow 2.2s ease-in-out infinite; }' +
      '@keyframes mwGrabGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(77,163,255,.5), 0 6px 18px rgba(0,0,0,.35); } 50% { box-shadow: 0 0 0 12px rgba(77,163,255,0), 0 6px 18px rgba(0,0,0,.35); } }' +
      // trip result: a glass card that rises in
      '.mw-overlay { -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); background: radial-gradient(ellipse at 50% 30%, rgba(24,44,92,.72), rgba(6,10,22,.9)) !important; }' +
      '.mw-card { background: linear-gradient(180deg, #172245 0%, #0f1730 100%) !important; border: 1px solid rgba(110,170,255,.28) !important; box-shadow: 0 20px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.03) inset, 0 0 40px rgba(31,111,235,.16); animation: mwCardIn .5s cubic-bezier(.2,.9,.3,1) both; }' +
      '@keyframes mwCardIn { from { opacity: 0; transform: translateY(26px) scale(.96); } to { opacity: 1; transform: none; } }' +
      '.mw-card h3 { font-size: 23px !important; letter-spacing: .01em; background: linear-gradient(90deg, #8cc4ff, #ffffff 50%, #ffd98a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }' +
      '.mw-card button:not(.mw-alt):not(:disabled) { background: linear-gradient(180deg, #3d89ff, #1f6feb) !important; box-shadow: 0 8px 22px rgba(31,111,235,.42), inset 0 1px 0 rgba(255,255,255,.28); }' +
      '.mw-card button.mw-alt { border-color: rgba(140,180,255,.25) !important; }' +
      '@media (prefers-reduced-motion: reduce) { .mw-atmo-sweep, .mw-atmo-intro { display: none; } .mw-grab:not(:disabled) { animation: none; } }';
    document.head.appendChild(st);
  }
  try { styles(); } catch (e) {}

  // ---------- a quiet chime for the list-complete moment (respects the sound setting) ----------
  var actx = null;
  function soundOff() {
    try { return !!(window.MiimiidMart && window.MiimiidMart.settings && window.MiimiidMart.settings.soundOff()); } catch (e) { return false; }
  }
  function chime() {
    try {
      if (soundOff()) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      [659, 880, 1319].forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        var t0 = actx.currentTime + i * 0.11;
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0 + 0.55);
      });
    } catch (e) {}
  }

  function num(s) {
    var m = /(-?\d+)/.exec(s || '');
    return m ? parseInt(m[1], 10) : NaN;
  }

  // ---------- world-space extras (these live inside the Phaser scene) ----------
  function worldExtras(scene, state) {
    var hasGlow = scene.textures && scene.textures.exists('glow');
    var ADD = (window.Phaser && Phaser.BlendModes) ? Phaser.BlendModes.ADD : 0;

    // cool rim of light under Miimiid so the character pops against the floor
    var rim = null;
    if (hasGlow && scene.player) {
      rim = scene.add.image(scene.player.x, scene.player.y - 4, 'glow')
        .setDisplaySize(170, 64).setTint(0x5aa2ff).setAlpha(0.3).setBlendMode(ADD);
      scene.events.on('update', function () {
        try {
          if (!rim || !rim.scene) return;
          rim.x = scene.player.x;
          rim.y = scene.player.y - 4;
          rim.setDepth((scene.player.depth || scene.player.y) - 0.6);
        } catch (e) {}
      });
    }

    // slow sunbeams drifting across the glossy floor
    if (hasGlow) {
      [[-300, 560, 15000, 0], [-700, 900, 19000, 6000]].forEach(function (b) {
        var beam = scene.add.image(b[0], b[1], 'glow')
          .setDisplaySize(130, 780).setAngle(24).setTint(0xfff1cf).setAlpha(0.07)
          .setBlendMode(ADD).setDepth(-91);
        scene.tweens.add({ targets: beam, x: 1750, duration: b[2], delay: b[3], repeat: -1, ease: 'Sine.easeInOut' });
      });
    }

    // the camera was allowed to scroll 230px above the store wall, which showed a big empty dark area when you walk the top aisle; keep only a thin margin
    scene.events.once('update', function () {
      try {
        var cam = scene.cameras && scene.cameras.main;
        if (cam && cam.setBounds) cam.setBounds(0, -70, 1400, 1130);
      } catch (e) {}
    });

    // flash sale: a pulsing spotlight on the discounted product, so the deal pulls your eye (is it on your list?)
    var spot = null, spotFor = null;
    if (hasGlow) {
      spot = scene.add.image(0, 0, 'glow').setDisplaySize(150, 130).setTint(0xff4d6d).setBlendMode(ADD).setAlpha(0).setVisible(false);
      scene.tweens.add({ targets: spot, scaleX: spot.scaleX * 1.18, scaleY: spot.scaleY * 1.18, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    state.setSale = function (p) {
      if (!spot || !spot.scene) return;
      if (!p) { if (spotFor) { spotFor = null; spot.setVisible(false); spot.setAlpha(0); } return; }
      if (spotFor === p) return;
      spotFor = p;
      var o = p.obj;
      spot.setPosition(o.x, o.y - o.displayHeight * 0.5).setDepth(o.depth - 0.1).setVisible(true).setAlpha(0.75);
    };

    // while your smart streak is alive, Miimiid leaves a green sparkle trail
    var lastTrail = 0, lx = 0, ly = 0;
    scene.events.on('update', function (time) {
      try {
        if (!state.streak || !scene.player) return;
        var px = scene.player.x, py = scene.player.y;
        var moved = Math.hypot(px - lx, py - ly);
        lx = px; ly = py;
        if (moved < 1.2 || time - lastTrail < 60) return;
        lastTrail = time;
        var d = scene.add.circle(px - 6 + Math.random() * 12, py - 4, 3 + Math.random() * 2, 0x7ee2a8, 0.8)
          .setDepth((scene.player.depth || py) - 0.8);
        scene.tweens.add({ targets: d, alpha: 0, scale: 0.2, y: d.y - 14, duration: 520, onComplete: function () { try { d.destroy(); } catch (e) {} } });
      } catch (e) {}
    });

    // checkout beacon, shown once the list is complete
    var beacon = [];
    if (hasGlow) {
      var halo = scene.add.image(CHECKOUT.x, CHECKOUT.y, 'glow')
        .setDisplaySize(520, 250).setTint(0xffc94d).setAlpha(0).setBlendMode(ADD).setDepth(-40);
      var ring = scene.add.ellipse(CHECKOUT.x, CHECKOUT.y + 6, 300, 110).setStrokeStyle(4, 0xffd34d, 0.9).setAlpha(0).setDepth(-39);
      scene.tweens.add({ targets: halo, scaleX: halo.scaleX * 1.1, scaleY: halo.scaleY * 1.1, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: ring, scaleX: 1.12, scaleY: 1.12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      beacon = [halo, ring];
    }

    state.setBeacon = function (on) {
      beacon.forEach(function (o) {
        if (!o || !o.scene) return;
        var target = on ? 1 : 0;
        if (o._wowT === target) return;
        o._wowT = target;
        scene.tweens.add({ targets: o, alpha: on ? (o.type === 'Ellipse' ? 0.9 : 0.55) : 0, duration: 500 });
      });
    };

    // a clean ring and a few sparks where you pick something up
    state.pickup = function () {
      try {
        var px = scene.player.x, py = scene.player.y;
        var depth = 99990;
        var ring2 = scene.add.ellipse(px, py - 2, 60, 22).setStrokeStyle(3, 0xffe08a, 0.95).setDepth(depth);
        scene.tweens.add({ targets: ring2, scaleX: 3.4, scaleY: 3.4, alpha: 0, duration: 520, ease: 'Cubic.easeOut', onComplete: function () { ring2.destroy(); } });
        for (var i = 0; i < 6; i++) {
          var a = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
          var sp = scene.add.circle(px, py - 30, 2.5, 0xfff0b8, 1).setDepth(depth);
          scene.tweens.add({
            targets: sp, x: px + Math.cos(a) * 60, y: py - 30 + Math.sin(a) * 36 - 24, alpha: 0, scale: 0.3,
            duration: 520 + Math.random() * 200, ease: 'Cubic.easeOut', onComplete: function (t, objs) { try { objs[0].destroy(); } catch (e) {} }
          });
        }
      } catch (e) {}
    };

    state.celebrate = function () {
      try { if (scene.popText) scene.popText(scene.player.x, scene.player.y - 100, 'List complete!', '#ffd34d'); } catch (e) {}
    };
  }

  // ---------- the screen layer (DOM, cheap, sits above the picture and below the buttons) ----------
  function start(scene, ctx) {
    try {
      var holder = document.querySelector('.mw-holder');
      if (!holder || holder.querySelector('.mw-atmo')) return;

      var atmo = document.createElement('div');
      atmo.className = 'mw-atmo';
      atmo.innerHTML =
        '<div class="mw-atmo-grade"></div>' +
        '<div class="mw-atmo-sweep"></div>' +
        '<div class="mw-atmo-edge e-streak"></div>' +
        '<div class="mw-atmo-edge e-tight"></div>' +
        '<div class="mw-atmo-edge e-sale"></div>' +
        '<div class="mw-atmo-edge e-done"></div>' +
        '<div class="mw-atmo-intro"></div>';
      holder.appendChild(atmo);
      setTimeout(function () {
        var intro = atmo.querySelector('.mw-atmo-intro');
        if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
      }, 1900);

      var state = {};
      try { worldExtras(scene, state); } catch (e) { console.error('mart wow world failed:', e); }

      var lastCount = 0, doneFired = false, lastWarm = -1;
      var clockEl = document.querySelector('[data-mw-clock]');
      var walletEl = document.querySelector('[data-mw-wallet]');
      var countEl = document.querySelector('[data-mw-count]');
      var comboEl = document.querySelector('[data-mw-combo]');
      var timer = setInterval(function () {
        try {
          if (!document.body.contains(atmo)) { clearInterval(timer); return; }

          // mood follows the closing clock: clean daylight at the start, golden hour near closing
          var pct = clockEl ? parseFloat(clockEl.style.width) : 100;
          if (!isFinite(pct)) pct = 100;
          var p = Math.max(0, Math.min(1, (60 - pct) / 60));        // 0 until 60% left, then rises to 1
          var warm = Math.round(p * 0.07 * 100) / 100;
          if (warm !== lastWarm) {
            lastWarm = warm;
            atmo.style.setProperty('--warm', String(warm));
            atmo.style.setProperty('--vig', String(Math.round((0.24 + p * 0.14) * 100) / 100));
            atmo.style.setProperty('--vig2', String(Math.round((0.08 + p * 0.05) * 100) / 100));
          }

          // streak alive
          var streak = !!(comboEl && comboEl.classList.contains('show') && num(comboEl.textContent) >= 2);
          atmo.classList.toggle('streak', streak);
          state.streak = streak;

          // flash sale on: siren edge and a spotlight on the discounted product
          var saleEl = document.querySelector('[data-mw-sale]');
          var saleOn = !!(saleEl && saleEl.classList.contains('show'));
          atmo.classList.toggle('sale', saleOn);
          if (state.setSale) {
            var sp = null;
            if (saleOn) {
              var stxt = saleEl.textContent || '';
              (scene.products || []).forEach(function (pr) {
                if (!sp && pr.item && !pr.taken && stxt.indexOf(pr.item.name) !== -1) sp = pr;
              });
            }
            state.setSale(sp);
          }

          // money or time is tight
          var wallet = walletEl ? num(walletEl.textContent) : NaN;
          var tight = (isFinite(wallet) && wallet < 5) || pct <= 15;   // under $5 = below the keep-$5 line
          atmo.classList.toggle('tight', tight);

          // pickups
          var count = countEl ? num(countEl.textContent) : 0;
          if (isFinite(count)) {
            if (count > lastCount && state.pickup) state.pickup();
            lastCount = count;
          }

          // list complete
          var chips = document.querySelectorAll('.mw-list .mw-chip');
          var allDone = chips.length > 0 && document.querySelectorAll('.mw-list .mw-chip.done').length === chips.length;
          var resultOpen = !!document.querySelector('.mw-overlay');
          if (allDone && !doneFired) {
            doneFired = true;
            chime();
            if (state.celebrate) state.celebrate();
          }
          if (!allDone) doneFired = false;
          var showDone = allDone && !resultOpen;
          atmo.classList.toggle('done', showDone);
          var payNow = pct <= 0 && lastCount > 0 && !resultOpen;      // store closed: the way to the counter lights up
          if (payNow) atmo.classList.add('tight');
          if (state.setBeacon) state.setBeacon(showDone || payNow);
        } catch (e) {}
      }, 160);

      scene.events.once('shutdown', function () { clearInterval(timer); });
      scene.events.once('destroy', function () { clearInterval(timer); });
    } catch (e) {
      console.error('mart wow failed:', e);
    }
  }

  window.MiimiidMartWow = { start: start };
})();
