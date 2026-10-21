/* Miimiid Mart: Daily Challenge (start screen, leaderboard, result extras and share button).
 * The server picks the day, keeps the one-attempt rule, scores the trip and ranks the players;
 * this file only draws what the server sends. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};
  const NO_OVERLAY = { 'X-Continue-Loading': 'false' };
  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(v) {
    if (typeof miimiidFunCenterEscapeHtml === 'function') return miimiidFunCenterEscapeHtml(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function injectStyles() {
    if (document.getElementById('mmd-styles')) return;
    const st = document.createElement('style');
    st.id = 'mmd-styles';
    st.textContent = `
      .mmd { max-width: 460px; margin: 0 auto; padding: 14px 2px 28px; color: #e6e9f0; }
      .mmd button { -webkit-tap-highlight-color: transparent; font-family: inherit; }
      .mmd-card { background: linear-gradient(165deg, #16213d 0%, #131a2c 65%); border: 1px solid #232c42; border-radius: 22px; padding: 22px 18px 18px; text-align: center; }
      .mmd-kicker { font-size: 11px; font-weight: 800; letter-spacing: .09em; color: #9ec5ff; }
      .mmd-card h3 { margin: 8px 0 6px; color: #fff; font-size: 23px; line-height: 1.2; }
      .mmd-card p { margin: 6px 0; font-size: 14px; line-height: 1.45; color: #c9d3ea; }
      .mmd-sub { font-size: 12px; color: #8a95b3; }
      .mmd-card p.mmd-sub { color: #8a95b3; }

      .mmd-week { display: flex; justify-content: space-between; gap: 6px; margin: 18px 0 4px; }
      .mmd-day { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 10px; color: #6f7b9b; font-weight: 700; }
      .mmd-dot { width: 100%; max-width: 36px; aspect-ratio: 1; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #0d1324; border: 1px solid #232c42; }
      .mmd-day.is-done .mmd-dot { background: #1f6feb; border-color: #1f6feb; }
      .mmd-day.is-today .mmd-dot { border-color: #4da3ff; box-shadow: 0 0 0 3px rgba(77, 163, 255, .22); }
      .mmd-day.is-done, .mmd-day.is-today { color: #c9d3ea; }
      .mmd-streaktext { margin: 8px 0 0; font-size: 13px; font-weight: 800; color: #ffc27a; }

      .mmd-play { margin-top: 18px; width: 100%; border: 0; border-radius: 999px; padding: 16px; font-weight: 800; font-size: 16px; background: #1f6feb; color: #fff; cursor: pointer; box-shadow: 0 8px 22px rgba(31, 111, 235, .35); }
      .mmd-play:active { transform: scale(.985); }
      .mmd-share { margin-top: 12px; width: 100%; border: 1px solid #1f6feb; border-radius: 999px; padding: 13px; font-weight: 800; font-size: 15px; background: rgba(31, 111, 235, .14); color: #cfe2ff; cursor: pointer; }
      .mmd-used { margin: 16px 0 0; padding: 12px; border-radius: 14px; background: rgba(8, 14, 30, .55); border: 1px solid #232c42; font-size: 14px; color: #c9d3ea; }
      .mmd-note { margin: 10px 0 0; font-size: 13px; color: #ffb4b4; }

      .mmd-starrow { display: flex; justify-content: center; gap: 8px; margin: 18px 0 2px; }
      .mmd-star { display: inline-block; opacity: 0; transform: scale(.3); animation: mmdPop .5s cubic-bezier(.2, 1.5, .4, 1) forwards; }
      .mmd-verdict { font-size: 16px; font-weight: 800; color: #ffd34d; margin: 4px 0 0; }
      .mmd-score { font-size: 54px; font-weight: 800; line-height: 1; margin: 10px 0 2px; color: #fff; font-variant-numeric: tabular-nums; }
      .mmd-rankpill { display: inline-block; margin: 8px 0 2px; padding: 5px 14px; border-radius: 999px; background: rgba(255, 211, 77, .12); border: 1px solid rgba(255, 211, 77, .45); color: #ffd34d; font-size: 13px; font-weight: 800; }
      @keyframes mmdPop { to { opacity: 1; transform: scale(1); } }

      .mmd-break { list-style: none; margin: 14px 0 4px; padding: 10px 12px; border-radius: 14px; background: rgba(8, 14, 30, .55); border: 1px solid #232c42; text-align: left; font-size: 13px; }
      .mmd-break li { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; color: #c9d3ea; }
      .mmd-break b.neg { color: #ff8a8a; }
      .mmd-break .mmd-total { margin-top: 4px; padding-top: 8px; border-top: 1px solid #232c42; font-size: 15px; color: #fff; }
      .mmd-stats { display: flex; justify-content: space-around; gap: 8px; margin: 14px 0 6px; }
      .mmd-stats b { display: block; font-size: 20px; color: #fff; }
      .mmd-stats span { font-size: 11px; color: #8a95b3; }

      .mmd-boardbox { margin: 18px 0 4px; padding: 12px; border-radius: 16px; background: rgba(8, 14, 30, .55); border: 1px solid #232c42; }
      .mmd-boardhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
      .mmd-board { list-style: none; margin: 0; padding: 0; text-align: left; }
      .mmd-row { display: flex; align-items: center; gap: 10px; padding: 7px 8px; border-radius: 12px; font-size: 14px; color: #e6e9f0; }
      .mmd-row b { margin-left: auto; font-variant-numeric: tabular-nums; }
      .mmd-rank { flex: 0 0 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #9ec5ff; background: rgba(158, 197, 255, .08); }
      .mmd-rank.r1 { background: #ffd34d; color: #3a2a00; }
      .mmd-rank.r2 { background: #cfd6e6; color: #2a3042; }
      .mmd-rank.r3 { background: #d99a63; color: #3a2108; }
      .mmd-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mmd-you { background: rgba(31, 111, 235, .22); }
      .mmd-empty { margin: 8px 0 4px; font-size: 13px; color: #8a95b3; }

      .mmd-links { display: flex; justify-content: center; gap: 4px; margin-top: 14px; flex-wrap: wrap; }
      .mmd-links button { background: none; border: 0; padding: 10px 12px; font-size: 13px; font-weight: 700; color: #8a95b3; cursor: pointer; }

      .mmd-nick { margin: 12px 0 2px; text-align: left; }
      .mmd-nickrow { display: flex; gap: 8px; margin-top: 4px; }
      .mmd-nickrow input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 999px; border: 1px solid #232c42; background: #0d1324; color: #e6e9f0; font-size: 14px; }
      .mmd-nickrow button { width: auto; margin-top: 0; padding: 10px 18px; border: 0; border-radius: 999px; background: #1f6feb; color: #fff; font-weight: 800; }

      .mmd-result { text-align: center; margin: 8px 0 12px; padding: 14px 12px; border-radius: 16px; background: rgba(31, 111, 235, .12); border: 1px solid #1f6feb; }
      @media (prefers-reduced-motion: reduce) { .mmd-star { animation: none; opacity: 1; transform: none; } }
    `;
    document.head.appendChild(st);
  }

  function milestone(streak) {
    if (streak >= 30) return '30 days in a row. Legend!';
    if (streak >= 7) return 'A full week in a row!';
    if (streak >= 3) return 'Three days in a row!';
    return '';
  }

  function shareText(res, dayKey, streak, rank) {
    const bits = [`Miimiid Mart Daily ${dayKey}: ${res.score} points, ${res.stars} of 3 stars, $${res.saved} left.`];
    if (rank > 0) bits.push(`I'm #${rank} today.`);
    if (streak > 1) bits.push(`${streak} day streak.`);
    bits.push('Can you beat me?');
    return bits.join(' ') + ' ' + location.origin;
  }

  function share(text, btn) {
    const flash = label => {
      if (!btn) return;
      const old = btn.textContent;
      btn.textContent = label;
      setTimeout(() => { btn.textContent = old; }, 1600);
    };
    if (navigator.share) { navigator.share({ text }).catch(() => {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash('Copied'), () => flash('Could not copy'));
      return;
    }
    flash('Sharing is not available here');
  }

  // counts a number up from 0 so the score feels earned
  function countUp(root) {
    root.querySelectorAll('[data-mmd-count]').forEach(el => {
      const to = Number(el.getAttribute('data-mmd-count'));
      if (!Number.isFinite(to) || REDUCED || to === 0) { el.textContent = Number.isFinite(to) ? String(to) : el.textContent; return; }
      const t0 = performance.now(), dur = 1100;
      el.textContent = '0';
      const tick = now => {
        if (!el.isConnected) return;
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function boardHtml(board) {
    if (!board) return '';
    const top = Array.isArray(board.top) ? board.top : [];
    const row = (rank, name, score, you) => {
      const cls = rank >= 1 && rank <= 3 ? ' r' + rank : '';
      return `<li class="mmd-row${you ? ' mmd-you' : ''}"><span class="mmd-rank${cls}">${esc(rank)}</span><span class="mmd-name">${esc(name)}</span><b>${esc(score)}</b></li>`;
    };
    const rows = top.map(r => row(r.rank, r.you ? r.name + ' (you)' : r.name, r.score, r.you)).join('');
    const outside = board.you && !top.some(r => r.you) ? row(board.you.rank, 'You', board.you.score, true) : '';
    const body = rows ? `<ol class="mmd-board">${rows}${outside}</ol>` : '<p class="mmd-empty">No scores yet today. Be the first on the board.</p>';
    const count = board.total ? `<span class="mmd-sub">${esc(board.total)} player${board.total === 1 ? '' : 's'}</span>` : '';
    return `<div class="mmd-boardbox"><div class="mmd-boardhead"><span class="mmd-kicker">TODAY'S TOP PLAYERS</span>${count}</div>${body}</div>`;
  }

  function starsHtml(n) {
    const star = (on, i) => `<span class="mmd-star" style="animation-delay:${(0.2 + i * 0.22).toFixed(2)}s"><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="${on ? '#ffd34d' : 'none'}" stroke="${on ? '#ffd34d' : '#3b4666'}" stroke-width="1.6" stroke-linejoin="round"/></svg></span>`;
    return `<div class="mmd-starrow">${[0, 1, 2].map(i => star(i < n, i)).join('')}</div>`;
  }

  function verdict(stars) {
    if (stars >= 3) return 'A perfect day';
    if (stars === 2) return 'A strong day';
    if (stars === 1) return 'You got through it';
    return 'A rough day';
  }

  function breakdownHtml(rows, total) {
    const list = rows.map(r => `<li><span>${esc(r.label)}</span><b class="${r.points < 0 ? 'neg' : ''}">${r.points > 0 ? '+' : ''}${esc(r.points)}</b></li>`).join('');
    return `<ul class="mmd-break">${list}<li class="mmd-total"><span>Total</span><b>${esc(total)}</b></li></ul>`;
  }

  function checkSvg() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  // seven days in a row, filled up to your current streak
  function weekHtml(streak, playedToday) {
    const n = Number(streak) > 0 ? Number(streak) : 0;
    const filled = n > 0 ? ((n - 1) % 7) + 1 : 0;
    const todayIdx = playedToday ? filled - 1 : (filled < 7 ? filled : -1);
    let out = '';
    for (let i = 0; i < 7; i++) {
      const done = i < filled;
      out += `<div class="mmd-day${done ? ' is-done' : ''}${i === todayIdx ? ' is-today' : ''}"><span class="mmd-dot">${done ? checkSvg() : ''}</span>${i + 1}</div>`;
    }
    return `<div class="mmd-week">${out}</div>`;
  }

  function menuHtml(info, notice, board) {
    const sit = info.situation || {};
    const res = info.result;
    let status;
    if (res) {
      const rank = board && board.you ? `<div class="mmd-rankpill">Rank #${esc(board.you.rank)} of ${esc(board.total)}</div>` : '';
      const detail = Array.isArray(res.breakdown) && res.breakdown.length
        ? breakdownHtml(res.breakdown, res.score)
        : `<div class="mmd-stats">
            <div><b>${esc(res.stars)}/3</b><span>Stars</span></div>
            <div><b>${esc(res.needsCovered)}/${esc(res.totalNeeds)}</b><span>Needs covered</span></div>
            <div><b>$${esc(res.saved)}</b><span>Left</span></div>
          </div>`;
      status = `${starsHtml(res.stars)}
        <div class="mmd-verdict">${esc(verdict(res.stars))}</div>
        <div class="mmd-score" data-mmd-count="${esc(res.score)}">${esc(res.score)}</div>
        <div class="mmd-sub">Daily score</div>
        ${rank}
        ${detail}
        <button type="button" class="mmd-share" data-mmd-share>Share my score</button>`;
    } else if (info.locked) {
      status = '<div class="mmd-used">Your official attempt for today is used. A new challenge arrives tomorrow.</div>';
    } else {
      status = '<button type="button" class="mmd-play" data-mmd-play>Play today\'s challenge</button>';
    }
    const ms = milestone(info.streak);
    return `<div class="mmd"><div class="mmd-card">
      <div class="mmd-kicker">DAILY CHALLENGE</div>
      <h3>${esc(sit.title || 'Today')}</h3>
      <p>${esc(sit.story || '')}</p>
      ${weekHtml(info.streak, !!res)}
      ${info.streak > 0 ? `<div class="mmd-streaktext">${esc(info.streak)} day streak${ms ? '. ' + esc(ms) : ''}</div>` : '<p class="mmd-sub">Play today to start your streak</p>'}
      ${notice ? `<p class="mmd-note">${esc(notice)}</p>` : ''}
      ${status}
      ${boardHtml(board)}
      <p class="mmd-sub" style="margin-top:12px">Same challenge for everyone. One official attempt a day. Practice trips do not count.</p>
      <div class="mmd-links">
        <button type="button" data-mmd-practice>Practice trip</button>
        <button type="button" data-mmd-settings>Settings</button>
        <button type="button" data-mmd-back>Back</button>
      </div>
    </div></div>`;
  }

  // Shows the menu inside the Fun Center and resolves with 'daily', 'practice' or 'back'.
  function pickMode(content, request, notice) {
    injectStyles();
    content.innerHTML = '<div class="miimiid-fun-loading">Loading today\'s challenge…</div>';
    return Promise.all([
      request('/api/fun-center/daily', { headers: NO_OVERLAY }),
      request('/api/fun-center/daily/leaderboard', { headers: NO_OVERLAY }).catch(() => null)
    ])
      .then(([info, board]) => new Promise(resolve => {
        content.innerHTML = menuHtml(info, notice, board);
        countUp(content);
        const wire = (sel, fn) => { const el = content.querySelector(sel); if (el) el.addEventListener('click', fn); };
        wire('[data-mmd-play]', () => resolve('daily'));
        wire('[data-mmd-practice]', () => resolve('practice'));
        wire('[data-mmd-back]', () => resolve('back'));
        wire('[data-mmd-settings]', () => {
          if (window.MiimiidMart.settings) window.MiimiidMart.settings.open(content, request, () => resolve(pickMode(content, request)));
        });
        wire('[data-mmd-share]', e => {
          const rank = board && board.you ? board.you.rank : 0;
          share(shareText(info.result, info.dayKey, info.streak, rank), e.currentTarget);
        });
      }))
      .catch(error => { console.error('daily status error:', error); return 'practice'; });
  }

  // Adds the daily score (counting up), the streak, your rank and a Share button to the trip result card.
  function decorateResult(overlayEl, r) {
    const d = r && r.daily;
    if (!d) return;
    injectStyles();
    const card = overlayEl.querySelector('.mw-card');
    const title = card && card.querySelector('h3');
    if (!title) return;
    const box = document.createElement('div');
    box.className = 'mmd-result';
    box.innerHTML = `<div class="mmd-kicker">DAILY CHALLENGE</div>
      <div class="mmd-score" data-mmd-count="${esc(d.score)}">${esc(d.score)}</div>
      <div class="mmd-rankslot"></div>
      <div class="mmd-sub">${d.streak > 1 ? esc(d.streak) + ' day streak. ' + esc(milestone(d.streak)) : 'Come back tomorrow for a new challenge'}</div>
      <button type="button" class="mmd-share" data-mmd-share>Share my score</button>`;
    title.insertAdjacentElement('afterend', box);
    countUp(box);
    let rank = 0;
    const shareBtn = box.querySelector('[data-mmd-share]');
    shareBtn.addEventListener('click', e => {
      share(shareText({ score: d.score, stars: r.stars, saved: r.saved }, d.dayKey, d.streak, rank), e.currentTarget);
    });
    // look up your rank once the score is in (if this fails, the card simply has no rank line)
    fetch('/api/fun-center/daily/leaderboard', { credentials: 'same-origin', headers: NO_OVERLAY })
      .then(res => res.json())
      .then(out => {
        const b = out && out.data;
        if (!b || !b.you || !box.isConnected) return;
        rank = b.you.rank;
        const slot = box.querySelector('.mmd-rankslot');
        if (slot) slot.innerHTML = `<div class="mmd-rankpill">Rank #${esc(b.you.rank)} of ${esc(b.total)}</div>`;
      })
      .catch(() => {});
  }

  window.MiimiidMart.daily = { pickMode, decorateResult };
})();
