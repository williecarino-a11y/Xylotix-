/* Miimiid Mart: result-card game feel (count-ups, mascot, confetti). Pure decoration:
 * every number shown here comes from the server's result and is only animated. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  const calm = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function injectStyles() {
    if (document.getElementById('mmj-styles')) return;
    const st = document.createElement('style');
    st.id = 'mmj-styles';
    st.textContent = `
      .mmj-rise { animation: mmjRise .4s cubic-bezier(.2, .9, .3, 1.2); }
      @keyframes mmjRise { from { transform: translateY(24px) scale(.96); opacity: 0; } to { transform: none; opacity: 1; } }
      .mmj-mascot { display: block; width: 64px; height: auto; margin: 0 auto 2px; }
      .mmj-bounce { animation: mmjBounce .6s ease-in-out 3; }
      @keyframes mmjBounce { 50% { transform: translateY(-14px); } }
      .mmj-perfect h3 { animation: mmjPop .7s ease-out; text-shadow: 0 0 14px rgba(77, 163, 255, .7); }
      @keyframes mmjPop { 0% { transform: scale(.6); } 60% { transform: scale(1.18); } 100% { transform: scale(1); } }
      .mmj-nudge { animation: mmjPulse 1.4s ease-in-out infinite; }
      @keyframes mmjPulse { 50% { box-shadow: 0 0 0 6px rgba(31, 111, 235, .35); } }
      .mmj-confetti { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 9; }
      .mmj-confetti i { position: absolute; top: -14px; width: 8px; height: 14px; border-radius: 2px; opacity: 0; animation: mmjFall linear forwards; }
      @keyframes mmjFall {
        0% { transform: translate3d(0, 0, 0) rotate(0); opacity: 1; }
        100% { transform: translate3d(var(--dx), 110vh, 0) rotate(var(--rot)); opacity: .9; }
      }
    `;
    document.head.appendChild(st);
  }

  function mascotSrc(r) {
    try {
      const assets = typeof MIIMIID_ASSETS !== 'undefined' ? MIIMIID_ASSETS : window.MIIMIID_ASSETS;
      const chars = assets && assets.characters && assets.characters.miimiid;
      if (!chars) return '';
      const poses = window.MIIMIID_FUN_POSES || {};
      const burned = Array.isArray(r.burnedOut) && r.burnedOut.length > 0;
      if (burned) return chars[poses.sad || 'sad'] || '';
      return chars[poses.happy || 'happy'] || '';
    } catch (e) {
      return '';
    }
  }

  function countUp(el, to, fmt, delay, ms) {
    if (!el) return;
    if (calm || !(to > 0)) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const start = performance.now() + delay;
    const step = now => {
      if (!document.body.contains(el)) return;
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function confetti(host) {
    const box = document.createElement('div');
    box.className = 'mmj-confetti';
    const colors = ['#4da3ff', '#7ee2a8', '#ffd34d', '#ff7a8a', '#ffffff'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      p.style.setProperty('--dx', ((Math.random() - 0.5) * 120) + 'px');
      p.style.setProperty('--rot', (360 + Math.random() * 540) + 'deg');
      box.appendChild(p);
    }
    host.appendChild(box);
    setTimeout(() => box.remove(), 4200);
  }

  // ctx = { overlay, result, tone(freq, dur, type, vol, delay) }
  function onResult(ctx) {
    try {
      const o = ctx && ctx.overlay;
      const r = (ctx && ctx.result) || {};
      const tone = (ctx && ctx.tone) || function () {};
      const card = o && o.querySelector('.mw-card');
      if (!card) return;
      injectStyles();

      const burned = Array.isArray(r.burnedOut) && r.burnedOut.length > 0;
      const perfect = r.stars === 3 && !burned;
      if (!calm) card.classList.add('mmj-rise');

      // Miimiid reacts at the top of the card
      const src = mascotSrc(r);
      if (src) {
        const img = document.createElement('img');
        img.className = 'mmj-mascot' + (perfect && !calm ? ' mmj-bounce' : '');
        img.alt = '';
        img.src = src;
        card.insertBefore(img, card.firstChild);
      }

      // numbers count up (the real values stay in the card if anything below fails)
      let tick = 0;
      card.querySelectorAll('div[style*="font-size:24px"]').forEach((el, i) => {
        const m = /^(\$?)(\d+)(.*)$/.exec(el.textContent.trim());
        if (!m) return;
        countUp(el, Number(m[2]), n => m[1] + n + m[3], 500 + i * 200, 700);
        if (!calm) setTimeout(() => tone(880 + i * 110, 0.05, 'square', 0.04), 500 + i * 200);
        tick++;
      });
      const xpLine = Array.from(card.querySelectorAll('p')).find(p => /^\+\d+ XP/.test(p.textContent.trim()));
      if (xpLine) {
        const m = /^\+(\d+) XP\D+\+(\d+) coins/.exec(xpLine.textContent.trim());
        if (m) {
          const xp = Number(m[1]);
          const coins = Number(m[2]);
          const show = (a, b) => { xpLine.textContent = `+${a} XP · +${b} coins`; };
          if (calm || (xp + coins) === 0) show(xp, coins);
          else {
            show(0, 0);
            const start = performance.now() + 500 + tick * 200 + 100;
            const step = now => {
              if (!document.body.contains(xpLine)) return;
              const t = Math.min(1, Math.max(0, (now - start) / 600));
              const e = 1 - Math.pow(1 - t, 3);
              show(Math.round(xp * e), Math.round(coins * e));
              if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        }
      }
      const daily = card.querySelector('.mmd-result .mmd-score');
      if (daily) countUp(daily, Number(daily.textContent) || 0, n => String(n), 900, 1000);

      // a perfect trip gets a bigger moment
      if (perfect) {
        card.classList.add('mmj-perfect');
        if (!calm) {
          setTimeout(() => { confetti(o); }, 1200);
          [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), 1200 + i * 110));
        }
      }

      // a gentle nudge toward another trip
      if (!calm) {
        setTimeout(() => {
          const again = o.querySelector('[data-again]');
          if (again) again.classList.add('mmj-nudge');
        }, 3200);
      }
    } catch (error) {
      console.error('result effects skipped:', error);
    }
  }

  window.MiimiidMart.juice = { onResult };
})();
