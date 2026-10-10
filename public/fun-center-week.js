/* Miimiid Mart: Survive the Week meters. The server decides the effects and the result;
 * this file draws the live bars while you shop and the final bars on the result card. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  const KEYS = [['health', '❤️', 'Health'], ['happiness', '😊', 'Happiness'], ['friends', '🤝', 'Friends']];

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  function injectStyles() {
    if (document.getElementById('mm-week-styles')) return;
    const st = document.createElement('style');
    st.id = 'mm-week-styles';
    st.textContent = `
      .mm-meters { display: flex; gap: 10px; margin: 0 4px 6px; padding: 6px 10px; background: #131a2c; border: 1px solid #232c42; border-radius: 12px; }
      .mm-meters .mm-meter { flex: 1; min-width: 0; gap: 5px; }
      .mm-meters .mm-meter-name { width: auto; }
      .mm-meters .mm-meter-num { width: 24px; }
      .mm-meter { display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 12px; font-weight: 800; color: #e6e9f0; text-align: left; }
      .mm-meter-name { width: 100px; flex: none; }
      .mm-meter-bar { flex: 1; height: 10px; border-radius: 999px; background: #0d1324; border: 1px solid #232c42; overflow: hidden; }
      .mm-meter-fill { height: 100%; width: 0; border-radius: 999px; background: #3fd08a; transition: width .35s ease-out, background .3s; }
      .mm-meter-num { width: 28px; text-align: right; }
      .mm-meter[data-level="low"] .mm-meter-fill { background: #ffb020; }
      .mm-meter[data-level="zero"] .mm-meter-fill { background: #ff5d5d; }
      .mm-meter[data-level="zero"] .mm-meter-num { color: #ff5d5d; animation: mwPulse .8s ease-in-out infinite; }
      .mm-result-meters { margin: 4px 0 8px; }
      .mm-burn { color: #ff8a8a; font-size: 13px; font-weight: 800; margin: 6px 0 0; }
    `;
    document.head.appendChild(st);
  }

  function rowHtml(k, v, warn, compact) {
    const level = v <= 0 ? 'zero' : v < warn ? 'low' : 'ok';
    return `<div class="mm-meter" data-k="${k[0]}" data-level="${level}">
      <span class="mm-meter-name">${compact ? k[1] : k[1] + ' ' + k[2]}</span>
      <div class="mm-meter-bar"><div class="mm-meter-fill" style="width:${v}%"></div></div>
      <b class="mm-meter-num">${v}</b></div>`;
  }

  function create(ctx) {
    const wk = ctx.week;
    if (!wk || !wk.situation) return null;
    injectStyles();
    const sit = wk.situation;

    const box = document.createElement('div');
    box.className = 'mm-meters';
    const listEl = ctx.content.querySelector('[data-mw-list]');
    if (listEl && listEl.parentNode) listEl.parentNode.insertBefore(box, listEl);

    function current() {
      const m = {};
      KEYS.forEach(k => { m[k[0]] = wk.meterStart - ((sit.drain && sit.drain[k[0]]) || 0); });
      ctx.S.basket.forEach(id => {
        const e = wk.effects[id];
        if (!e) return;
        KEYS.forEach(k => { if (e[k[0]]) m[k[0]] += e[k[0]]; });
      });
      KEYS.forEach(k => { m[k[0]] = clamp(m[k[0]]); });
      return m;
    }

    let built = false;
    function update() {
      const m = current();
      if (!built) {
        built = true;
        box.innerHTML = '<div class="mm-meters-title">How you will be tonight</div>' + KEYS.map(k => rowHtml(k, m[k[0]], wk.meterWarn)).join('');
        return;
      }
      KEYS.forEach(k => {
        const row = box.querySelector(`[data-k="${k[0]}"]`);
        const v = m[k[0]];
        row.querySelector('.mm-meter-fill').style.width = v + '%';
        row.querySelector('.mm-meter-num').textContent = String(v);
        row.dataset.level = v <= 0 ? 'zero' : v < wk.meterWarn ? 'low' : 'ok';
      });
    }

    function warning() {
      const m = current();
      const empty = KEYS.filter(k => m[k[0]] <= 0).map(k => k[2]);
      if (!empty.length) return '';
      return `Careful: your ${empty.join(' and ')} meter is empty. If I ring you up now, you will burn out.`;
    }

    update();
    return { update, warning, current };
  }

  // The final bars on the result card (numbers come from the server).
  function resultHtml(r) {
    if (!r || !r.meters) return '';
    injectStyles();
    const burned = Array.isArray(r.burnedOut) ? r.burnedOut : [];
    return `<div class="mm-result-meters">
      ${KEYS.map(k => rowHtml(k, clamp(Number(r.meters[k[0]]) || 0), 30)).join('')}
      ${burned.length ? '<p class="mm-burn">🔥 You burned out. A meter hit zero.</p>' : ''}
    </div>`;
  }

  window.MiimiidMart.week = { create, resultHtml };
})();
