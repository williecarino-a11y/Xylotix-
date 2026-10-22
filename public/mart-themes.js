/*
 * MIIMIID MART THEMES
 * Gives every Mart level its own world inside the store: colour grading, light behaviour, living particles,
 * a pressure effect that follows your money and the clock, and a short cinematic level intro.
 * Visual only: it never changes prices, items, scores or rules.
 *
 * No edits needed in fun-center-world.js. It wraps MiimiidMartWow.start (mart-wow.js) and reads
 * MiimiidMart.levels.current, which fun-center-levels.js sets when a level trip is picked.
 * Practice trips and the Daily Challenge are not touched. If anything fails, the store looks as before.
 */
(function () {
  'use strict';

  var THEMES = {
    1: { // First Paycheck: fresh morning, clean and friendly
      acc: '#6ee7b7',
      filter: 'saturate(1.08) brightness(1.04)',
      tint: 'linear-gradient(180deg, rgba(150,255,225,.07), rgba(255,244,200,.05))',
      vig: { c: '3,12,18', a: 0.22, vr: 84, vr2: 70 },
      p: { kind: 'motes', n: 22, colors: ['255,244,214', '200,255,235'] }
    },
    2: { // Sale Season: hot sale lighting, price-tag confetti, golden shine
      acc: '#ffb43d',
      filter: 'saturate(1.22) contrast(1.05) brightness(1.03)',
      tint: 'linear-gradient(180deg, rgba(255,70,60,.16), rgba(255,190,60,.10))',
      vig: { c: '40,6,8', a: 0.3, vr: 80, vr2: 66 },
      edge: { c: 'rgba(255,170,50,.30)', s: [2.2, 1.4] },
      shine: 'rgba(255,225,140,.16)',
      p: { kind: 'tags', n: 22, colors: ['255,72,72', '255,200,60', '255,255,255'] }
    },
    3: { // Rival Aisle: cold, tense, flickering lights, pressure rises with the clock
      acc: '#8fb8ff',
      filter: 'saturate(.78) contrast(1.1) brightness(.93)',
      tint: 'linear-gradient(180deg, rgba(60,100,190,.22), rgba(20,40,90,.20))',
      vig: { c: '2,6,20', a: 0.38, vr: 76, vr2: 62 },
      edge: { c: 'rgba(255,160,50,.34)', s: [2.0, 0.6] },
      flicker: true,
      p: { kind: 'fog', n: 6, colors: ['150,185,255', '120,150,230'] }
    },
    4: { // Friend's Night: dusk, party glow, a slow beat
      acc: '#d58bff',
      filter: 'saturate(1.14) contrast(1.05) brightness(.93)',
      tint: 'linear-gradient(180deg, rgba(130,60,220,.26), rgba(255,80,160,.16))',
      vig: { c: '14,4,30', a: 0.34, vr: 78, vr2: 64 },
      edge: { c: 'rgba(230,110,255,.28)', s: [2.6, 1.6] },
      beat: true,
      p: { kind: 'bokeh', n: 16, colors: ['255,110,200', '170,110,255', '110,210,255'] }
    },
    5: { // Rent Week: drained and tight, the room squeezes in as your money drops
      acc: '#9db4d3',
      filter: 'saturate(.55) contrast(1.06) brightness(.9)',
      tint: 'linear-gradient(180deg, rgba(80,100,130,.24), rgba(40,50,70,.22))',
      vig: { c: '4,8,16', a: 0.42, vr: 80, vr2: 66 },
      squeeze: true,
      p: { kind: 'dust', n: 18, colors: ['190,205,225', '160,175,200'] }
    },
    6: { // Payday Chaos: strobing alarm light, glitch band, sparks, intensity builds
      acc: '#ff5a5a',
      filter: 'saturate(1.26) contrast(1.1) brightness(.97)',
      tint: 'linear-gradient(180deg, rgba(255,40,70,.14), rgba(40,60,255,.10))',
      vig: { c: '20,2,10', a: 0.4, vr: 76, vr2: 62 },
      edge: { strobe: true, s: [1.5, 0.55] },
      glitch: true,
      flicker: true,
      p: { kind: 'sparks', n: 26, colors: ['255,150,60', '255,210,90', '255,90,90'] }
    }
  };

  function css() {
    if (document.getElementById('mart-themes-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-themes-css';
    st.textContent =
      '.mt-layer { position: absolute; inset: 0; z-index: 5; pointer-events: none; overflow: hidden; border-radius: inherit; }' +
      '.mt-layer > * { position: absolute; inset: 0; }' +
      '.mt-tint { transition: opacity .8s ease; }' +
      '.mt-vig { background: radial-gradient(ellipse var(--vr,80%) var(--vr2,66%) at 50% 46%, rgba(0,0,0,0) 45%, rgba(var(--vc,3,7,18), var(--va,.3)) 100%); }' +
      '.mt-dim { background: #02040c; opacity: 0; }' +
      '.mt-edge { box-shadow: inset 0 0 70px 4px var(--ec, rgba(255,255,255,.2)); animation: mtBreath var(--es, 2s) ease-in-out infinite; }' +
      '.mt-edge.strobe { animation: mtStrobe var(--es, 1.4s) ease-in-out infinite; }' +
      '@keyframes mtBreath { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }' +
      '@keyframes mtStrobe { 0%, 100% { box-shadow: inset 0 0 74px 6px rgba(255,50,70,.5); opacity: .55; } 50% { box-shadow: inset 0 0 74px 6px rgba(70,90,255,.5); opacity: 1; } }' +
      '.mt-shine { top: -10%; bottom: -10%; left: -50%; right: auto; width: 40%; transform: skewX(-18deg);' +
      '  background: linear-gradient(90deg, rgba(255,255,255,0), var(--sc, rgba(255,255,255,.12)), rgba(255,255,255,0)); animation: mtShine 7s ease-in-out infinite; }' +
      '@keyframes mtShine { 0%, 55% { transform: translateX(0) skewX(-18deg); opacity: 0; } 60% { opacity: 1; } 85%, 100% { transform: translateX(420%) skewX(-18deg); opacity: 0; } }' +
      '.mt-beat { animation: mtBeat 1.2s ease-in-out infinite; }' +
      '@keyframes mtBeat { 0%, 100% { opacity: .82; } 12% { opacity: 1; } 30% { opacity: .88; } }' +
      '.mt-glitch { top: 0; bottom: auto; height: 11%; background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.07) 40%, rgba(255,70,90,.08) 60%, rgba(255,255,255,0)); animation: mtGlitch 4.6s linear infinite; }' +
      '@keyframes mtGlitch { 0%, 70% { transform: translateY(-120%); opacity: 0; } 74% { opacity: 1; } 100% { transform: translateY(980%); opacity: 0; } }' +
      '.mt-canvas { width: 100%; height: 100%; }' +
      // the level intro
      '.mt-intro { z-index: 6; }' +
      '.mt-intro > * { position: absolute; inset: 0; }' +
      '.mt-bar { height: 12%; background: #03060f; animation: mtBar 3s cubic-bezier(.3,.8,.3,1) .35s both; }' +
      '.mt-bar.top { top: 0; bottom: auto; --d: -100%; } .mt-bar.bot { bottom: 0; top: auto; --d: 100%; }' +
      '@keyframes mtBar { 0% { transform: translateY(var(--d)); } 14%, 78% { transform: translateY(0); } 100% { transform: translateY(var(--d)); } }' +
      '.mt-card { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 0 28px; animation: mtCard 3s ease .35s both; }' +
      '@keyframes mtCard { 0% { opacity: 0; transform: translateY(12px) scale(.97); } 16%, 76% { opacity: 1; transform: none; } 100% { opacity: 0; transform: translateY(-8px); } }' +
      '.mt-kick { font-size: 12px; font-weight: 800; letter-spacing: .32em; color: var(--acc, #8cc4ff); text-shadow: 0 2px 10px rgba(0,0,0,.85), 0 0 18px var(--acc, #8cc4ff); }' +
      '.mt-name { margin-top: 8px; font-size: 34px; font-weight: 900; letter-spacing: .01em; color: #fff; text-shadow: 0 4px 26px rgba(0,0,0,.7), 0 0 28px var(--acc, #8cc4ff); }' +
      '.mt-line { width: 64px; height: 3px; border-radius: 3px; margin: 12px 0 10px; background: var(--acc, #8cc4ff); box-shadow: 0 0 14px var(--acc, #8cc4ff); }' +
      '.mt-mission { max-width: 300px; font-size: 13px; line-height: 1.45; color: #dfe6f7; text-shadow: 0 2px 12px rgba(0,0,0,.8); }' +
      '@media (prefers-reduced-motion: reduce) { .mt-edge, .mt-shine, .mt-beat, .mt-glitch { animation: none; } .mt-shine, .mt-glitch { display: none; } }';
    document.head.appendChild(st);
  }

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function num(s) { var m = /(-?\d+)/.exec(s || ''); return m ? parseInt(m[1], 10) : NaN; }

  function sprite(rgb) {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',.35)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  }

  // ---------- living particles (one small canvas, capped, paused when the page is hidden) ----------
  function particles(canvas, holder, spec, state) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, list = [], sprites = {}, t = 0, last = 0, raf = 0, k = spec.kind;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function resize() {
      var w = holder.clientWidth, h = holder.clientHeight;
      if (!w || !h || (w === W && h === H)) return;
      W = w; H = h;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function init(p, first) {
      p.c = spec.colors[(Math.random() * spec.colors.length) | 0];
      p.ph = rnd(0, 6.28);
      if (k === 'motes') { p.x = rnd(0, W); p.y = first ? rnd(0, H) : H + 10; p.r = rnd(0.8, 2.2); p.vx = rnd(-4, 4); p.vy = rnd(-12, -4); p.a = rnd(0.25, 0.7); }
      else if (k === 'tags') { p.x0 = rnd(0, W); p.y = first ? rnd(-20, H) : rnd(-40, -8); p.w = rnd(6, 11); p.h = rnd(4, 7); p.vy = rnd(38, 80); p.sw = rnd(10, 26); p.rot = rnd(0, 6.28); p.vr = rnd(-3, 3); p.a = rnd(0.55, 0.9); }
      else if (k === 'fog') { p.r = rnd(130, 230); p.x = first ? rnd(-p.r, W) : -p.r; p.y = rnd(H * 0.25, H * 0.95); p.vx = rnd(8, 18); p.a = rnd(0.05, 0.1); }
      else if (k === 'bokeh') { p.r = rnd(8, 26); p.x = rnd(0, W); p.y = first ? rnd(0, H) : H + p.r; p.vy = rnd(-26, -10); p.vx = rnd(-5, 5); p.a = rnd(0.14, 0.3); }
      else if (k === 'dust') { p.x = rnd(0, W); p.y = first ? rnd(0, H) : -6; p.r = rnd(0.7, 1.6); p.vy = rnd(8, 18); p.vx = rnd(-3, 3); p.a = rnd(0.2, 0.45); }
      else if (k === 'sparks') { p.x = rnd(0, W); p.y = first ? rnd(0, H) : H + 6; p.vy = rnd(-90, -45); p.vx = rnd(-14, 14); p.len = rnd(5, 12); p.a = rnd(0.35, 0.8); }
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = 0; return; }
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016; last = now; t += dt;
      resize();
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var speed = 1 + (state.i || 0) * (k === 'sparks' ? 1.2 : 0.4);
      ctx.globalCompositeOperation = (k === 'bokeh' || k === 'sparks') ? 'lighter' : 'source-over';
      for (var n = 0; n < list.length; n++) {
        var p = list[n];
        if (k === 'motes') {
          p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < -10) init(p, false);
          ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t * 1.6 + p.ph));
          ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        } else if (k === 'tags') {
          p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > H + 12) init(p, false);
          var x = p.x0 + Math.sin(t * 1.2 + p.ph) * p.sw;
          ctx.save(); ctx.translate(x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.a;
          ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.22, p.h);
          ctx.restore();
        } else if (k === 'fog') {
          p.x += p.vx * dt; if (p.x > W + p.r) init(p, false);
          var s = sprites[p.c] || (sprites[p.c] = sprite(p.c));
          ctx.globalAlpha = p.a; ctx.drawImage(s, p.x - p.r, p.y - p.r * 0.6, p.r * 2, p.r * 1.2);
        } else if (k === 'bokeh') {
          p.x += p.vx * dt; p.y += p.vy * dt; if (p.y < -p.r) init(p, false);
          var s2 = sprites[p.c] || (sprites[p.c] = sprite(p.c));
          ctx.globalAlpha = p.a * (0.7 + 0.3 * Math.sin(t * 1.3 + p.ph));
          ctx.drawImage(s2, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        } else if (k === 'dust') {
          p.x += p.vx * dt; p.y += p.vy * dt; if (p.y > H + 6) init(p, false);
          ctx.globalAlpha = p.a; ctx.fillStyle = 'rgb(' + p.c + ')'; ctx.fillRect(p.x, p.y, p.r * 1.6, p.r * 1.6);
        } else if (k === 'sparks') {
          p.x += p.vx * dt * speed; p.y += p.vy * dt * speed; if (p.y < -14) init(p, false);
          ctx.globalAlpha = p.a; ctx.strokeStyle = 'rgb(' + p.c + ')'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.08, p.y - p.vy * 0.08 * (p.len / 8)); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    resize();
    for (var i = 0; i < spec.n; i++) { var q = {}; init(q, true); list.push(q); }
    raf = requestAnimationFrame(frame);
    return function stop() { cancelAnimationFrame(raf); };
  }

  // ---------- build one level's world ----------
  function apply(scene) {
    var lv = window.MiimiidMart && window.MiimiidMart.levels && window.MiimiidMart.levels.current;
    var holder = document.querySelector('.mw-holder');
    if (!holder) return;
    var old = holder.querySelector('.mt-layer');
    if (old && old._mtStop) old._mtStop();
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!lv) return;
    var T = THEMES[lv.n];
    if (!T) return;
    css();

    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var layer = document.createElement('div');
    layer.className = 'mt-layer';
    layer.style.setProperty('--acc', T.acc);
    var html = '<div class="mt-tint' + (T.beat ? ' mt-beat' : '') + '" style="background:' + T.tint + '"></div>' +
      '<div class="mt-vig"></div>';
    if (T.shine) html += '<div class="mt-shine" style="--sc:' + T.shine + '"></div>';
    if (T.edge) html += '<div class="mt-edge' + (T.edge.strobe ? ' strobe' : '') + '"' + (T.edge.c ? ' style="--ec:' + T.edge.c + '"' : '') + '></div>';
    if (T.glitch) html += '<div class="mt-glitch"></div>';
    html += '<canvas class="mt-canvas"></canvas><div class="mt-dim"></div>';
    html += '<div class="mt-intro"><div class="mt-bar top"></div><div class="mt-bar bot"></div>' +
      '<div class="mt-card"><div class="mt-kick">LEVEL ' + lv.n + '</div><div class="mt-name"></div><div class="mt-line"></div><div class="mt-mission"></div></div></div>';
    layer.innerHTML = html;
    layer.querySelector('.mt-name').textContent = lv.title || '';
    layer.querySelector('.mt-mission').textContent = lv.mission || '';
    holder.appendChild(layer);

    var vigEl = layer.querySelector('.mt-vig'), edgeEl = layer.querySelector('.mt-edge'), dim = layer.querySelector('.mt-dim');
    function setVig(a, vr, vr2) {
      vigEl.style.setProperty('--vc', T.vig.c);
      vigEl.style.setProperty('--va', String(a));
      vigEl.style.setProperty('--vr', vr + '%');
      vigEl.style.setProperty('--vr2', vr2 + '%');
    }
    setVig(T.vig.a, T.vig.vr, T.vig.vr2);

    // real colour grading on the picture itself
    var cv = holder.querySelector('canvas:not(.mt-canvas)'), cvOld = cv ? cv.style.filter : '';
    if (cv && T.filter) cv.style.filter = T.filter;

    var state = { i: 0 };
    var stopParticles = (!reduce && T.p) ? particles(layer.querySelector('.mt-canvas'), holder, T.p, state) : null;
    var timers = [];
    var done = false;
    function stop() {
      if (done) return; done = true;
      if (stopParticles) stopParticles();
      timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
      if (cv) cv.style.filter = cvOld;
    }
    layer._mtStop = stop;

    // light flicker (cold store, chaos): two quick dips of the lights at random moments
    function blink() {
      if (done) return;
      var seq = [0.38, 0, 0.26, 0];
      seq.forEach(function (v, i) { timers.push(setTimeout(function () { if (!done) dim.style.opacity = String(v); }, i * 70)); });
      timers.push(setTimeout(blink, rnd(4500, 9000) * (1 - state.i * 0.4)));
    }
    if (T.flicker && !reduce) timers.push(setTimeout(blink, 5200));

    // pressure: follows the clock and your money
    var clockEl = document.querySelector('[data-mw-clock]'), walletEl = document.querySelector('[data-mw-wallet]'), w0 = 0;
    timers.push(setInterval(function () {
      try {
        if (!document.body.contains(layer)) { stop(); return; }
        var pct = clockEl ? parseFloat(clockEl.style.width) : 100;
        if (!isFinite(pct)) pct = 100;
        var i = clamp((100 - pct) / 100, 0, 1);
        state.i = i;
        if (edgeEl && T.edge && T.edge.s) edgeEl.style.setProperty('--es', (T.edge.s[0] + (T.edge.s[1] - T.edge.s[0]) * i).toFixed(2) + 's');
        if (T.squeeze) {
          var w = walletEl ? num(walletEl.textContent) : NaN;
          if (isFinite(w) && w > w0) w0 = w;
          var sq = (isFinite(w) && w0 > 0) ? clamp(1 - w / w0, 0, 1) : 0;
          var s = Math.max(sq, i * 0.6);
          setVig(T.vig.a + s * 0.3, T.vig.vr - s * 26, T.vig.vr2 - s * 24);
        } else if (T.flicker || T.edge) {
          setVig(T.vig.a + i * 0.12, T.vig.vr - i * 8, T.vig.vr2 - i * 8);
        }
      } catch (e) {}
    }, 220));

    // the intro card removes itself
    timers.push(setTimeout(function () {
      var intro = layer.querySelector('.mt-intro');
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    }, 3500));
  }

  // ---------- hook: run after the store's own atmosphere starts ----------
  function hook() {
    var W = window.MiimiidMartWow;
    if (!W) return false;
    if (W._themed) return true;
    var orig = W.start;
    W.start = function (scene, ctx) {
      var r = orig.apply(this, arguments);
      try { apply(scene); } catch (e) { console.error('mart themes failed:', e); }
      return r;
    };
    W._themed = true;
    return true;
  }
  if (!hook()) {
    var tries = 0, wait = setInterval(function () { if (hook() || ++tries > 100) clearInterval(wait); }, 100);
  }

  window.MiimiidMartThemes = { accent: function (n) { return THEMES[n] ? THEMES[n].acc : null; } };
})();
