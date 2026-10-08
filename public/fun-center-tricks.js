/* Miimiid Mart: the Trick Store scanner.
 * Shelf deals may be fake. The server knows the truth; this file draws the badges,
 * the scan button and the reveal. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  let cur = [];    // this trip's deals as the shelves show them

  // The world file asks this when it works out a price.
  window.MiimiidMart.trickPrice = function (itemId) {
    const t = cur.find(x => x.itemId === itemId);
    return t ? t.price : null;
  };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectStyles() {
    if (document.getElementById('mm-tricks-styles')) return;
    const st = document.createElement('style');
    st.id = 'mm-tricks-styles';
    st.textContent = `
      .mw-scan { width: 78px; height: 78px; border-radius: 50%; border: 3px solid #ffb020; background: #2a1d05; color: #ffd34d; font-size: 28px; font-weight: 800; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
      .mw-scan small { font-size: 11px; font-weight: 700; }
      .mw-scan:disabled { opacity: .35; cursor: default; }
      .mw-scan.ready { animation: mwPulse .9s ease-in-out infinite; }
      .mm-tricks { margin: 6px 0; text-align: left; font-size: 13px; }
      .mm-tricks-title { font-weight: 800; color: #ffd34d; margin-bottom: 4px; }
      .mm-trick-row { padding: 5px 0; border-top: 1px solid #232c42; }
      .mm-trick-row small { color: #9aa4bd; }
    `;
    document.head.appendChild(st);
  }

  function create(ctx) {
    injectStyles();
    cur = (ctx.tricks || []).map(t => Object.assign({ scanned: false, verdict: null, text: null, shown: '' }, t));
    if (!cur.length) return null;

    const btn = ctx.content.querySelector('[data-mw-scan]');
    let scansLeft = ctx.scansLeft;
    let target = null;
    let busy = false;

    ctx.say('Some deals here may be tricks! Stand next to a deal and tap 🔍 Scan. You get ' + scansLeft + ' scans.');

    function setBtn() {
      if (!btn) return;
      btn.innerHTML = `🔍<small>${scansLeft} left</small>`;
      const off = !target || busy || ctx.S.busy || (scansLeft <= 0 && !target.scanned);
      btn.disabled = off;
      btn.classList.toggle('ready', !off && !target.scanned);
    }

    function badgeState(t) {
      if (!t.scanned) return 'open';
      return t.verdict === 'fake' ? 'fake' : 'real';
    }

    function drawBadge(scene, t, p) {
      if (!t.text || !t.text.active) {
        t.text = scene.add.text(p.x, p.sy - 100, '', {
          fontSize: '13px', color: '#ffffff', fontStyle: 'bold', align: 'center', padding: { x: 6, y: 2 }
        }).setOrigin(0.5, 1).setDepth(p.sy + 3);
        t.shown = '';
      }
      const state = badgeState(t);
      if (t.shown !== state) {
        t.shown = state;
        if (state === 'open') {
          t.text.setText(t.badge + (t.was ? '\nwas $' + t.was : ''));
          t.text.setBackgroundColor(t.urgent ? '#c2410c' : '#e0245e');
        } else if (state === 'fake') {
          t.text.setText('🚫 FAKE');
          t.text.setBackgroundColor('#7f1d1d');
        } else {
          t.text.setText('✅ REAL DEAL');
          t.text.setBackgroundColor('#166534');
        }
      }
      t.text.setVisible(!p.taken);
    }

    function tick(scene) {
      if (!scene || !scene.products) return;
      cur.forEach(t => {
        const p = scene.products.find(q => q.item.id === t.itemId);
        if (p) drawBadge(scene, t, p);
      });
      const near = ctx.nearestProduct(scene);
      target = near && !near.taken ? (cur.find(t => t.itemId === near.item.id) || null) : null;
      setBtn();
    }

    async function scan() {
      const scene = ctx.getScene();
      if (!scene || !target || busy || ctx.S.busy) return;
      const t = target;
      const p = scene.products.find(q => q.item.id === t.itemId);
      if (!p) return;
      busy = true;
      ctx.S.busy = true;
      setBtn();

      const ring = scene.add.circle(p.x, p.y, 10, 0x4da3ff, 0.4).setDepth(p.sy + 5);
      scene.tweens.add({ targets: ring, scale: 6, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      ctx.SFX.tone(1200, 0.25, 'sine', 0.06);
      ctx.SFX.tone(1800, 0.2, 'sine', 0.05, 0.12);

      try {
        const r = await ctx.request(
          `/api/fun-center/shop/session/${encodeURIComponent(ctx.S.sessionId)}/scan`,
          { method: 'POST', body: JSON.stringify({ itemId: t.itemId }), headers: ctx.NO_OVERLAY }
        );
        scansLeft = typeof r.scansLeft === 'number' ? r.scansLeft : scansLeft;
        t.scanned = true;
        t.verdict = r.verdict;
        await new Promise(res => setTimeout(res, 450));
        if (r.verdict === 'fake') {
          scene.popText(p.x, p.sy - 135, 'BUSTED!', '#ff6b6b');
          scene.cameras.main.shake(160, 0.003);
          if (ctx.SFX.stinger) ctx.SFX.stinger('alert');
          else ctx.SFX.tone(220, 0.3, 'sawtooth', 0.06);
        } else {
          scene.popText(p.x, p.sy - 135, 'REAL DEAL!', '#7ee2a8');
          ctx.SFX.coin();
        }
        ctx.say(`${r.title} ${r.detail}`);
        ctx.assistant.say(r.detail, null, { name: 'Scanner · ' + (r.verdict === 'fake' ? 'Fake' : 'Real'), face: '🔍' });
      } catch (error) {
        console.error('scan error:', error);
        ctx.say(error.message || 'The scanner did not work. Try again.');
      } finally {
        busy = false;
        ctx.S.busy = false;
        setBtn();
      }
    }

    if (btn) btn.addEventListener('click', scan);
    setBtn();
    return { tick };
  }

  // The "what was really going on" part of the result card.
  function resultHtml(r) {
    if (!r || !Array.isArray(r.tricks) || !r.tricks.length) return '';
    injectStyles();
    const icon = { fell: '🪤', knew: '🤷', busted: '🔍', skipped: '👀', deal: '✅', missed: '😬' };
    const note = {
      fell: 'You fell for it.', knew: 'You knew, and bought anyway.', busted: 'You busted it!',
      skipped: 'You skipped it.', deal: 'You got a real deal.', missed: 'A real deal you passed on.'
    };
    const fell = r.tricks.filter(t => t.status === 'fell').length;
    const busted = r.tricks.filter(t => t.status === 'busted').length;
    const head = `Trick Store: ${busted} busted${fell ? `, fell for ${fell}` : ''}${r.trickBonus ? ` · +${r.trickBonus} bonus coins` : ''}`;
    return `<div class="mm-tricks"><div class="mm-tricks-title">${esc(head)}</div>` +
      r.tricks.map(t => `<div class="mm-trick-row">${icon[t.status] || '•'} ${esc(t.name)}: ${esc(note[t.status] || '')}<br><small>${esc(t.detail)}</small></div>`).join('') +
      '</div>';
  }

  window.MiimiidMart.tricks = { create, resultHtml };
})();
