/* Miimiid Mart: Daily Challenge (menu, leaderboard and share button). The server picks the day, keeps the
 * one-attempt rule, scores the trip and ranks the players; this file only draws what the server sends. */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};
  const NO_OVERLAY = { 'X-Continue-Loading': 'false' };

  function esc(v) {
    if (typeof miimiidFunCenterEscapeHtml === 'function') return miimiidFunCenterEscapeHtml(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function injectStyles() {
    if (document.getElementById('mmd-styles')) return;
    const st = document.createElement('style');
    st.id = 'mmd-styles';
    st.textContent = `
      .mmd { max-width: 440px; margin: 0 auto; padding: 28px 4px 24px; }
      .mmd-card { background: #131a2c; border: 1px solid #232c42; border-radius: 18px; padding: 22px 18px; color: #e6e9f0; text-align: center; }
      .mmd-kicker { font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #9ec5ff; }
      .mmd-card h3 { margin: 6px 0 4px; color: #4da3ff; font-size: 22px; }
      .mmd-card p { margin: 6px 0; font-size: 14px; line-height: 1.4; }
      .mmd-sub { font-size: 12px; color: #9aa4bd; }
      .mmd-streak { display: inline-block; margin: 8px 0 2px; padding: 4px 12px; border-radius: 999px; background: rgba(31, 111, 235, .18); border: 1px solid #1f6feb; font-size: 12px; font-weight: 800; }
      .mmd-score { font-size: 44px; font-weight: 800; line-height: 1; margin: 10px 0 2px; }
      .mmd-card button { margin-top: 10px; width: 100%; border: 0; border-radius: 999px; padding: 13px; font-weight: 800; font-size: 15px; background: #1f6feb; color: #fff; cursor: pointer; }
      .mmd-card button.mmd-alt { background: transparent; border: 1px solid #232c42; color: #9aa4bd; }
      .mmd-note { margin: 8px 0 0; font-size: 13px; color: #ffb4b4; }
      .mmd-stats { display: flex; justify-content: space-around; gap: 8px; margin: 12px 0 6px; }
      .mmd-stats b { display: block; font-size: 20px; }
      .mmd-stats span { font-size: 11px; color: #9aa4bd; }
      .mmd-boardbox { margin: 14px 0 4px; padding: 12px; border-radius: 14px; background: rgba(8, 14, 30, 0.55); border: 1px solid #232c42; }
      .mmd-boardbox .mmd-kicker { margin-bottom: 6px; }
      .mmd-board { list-style: none; margin: 0; padding: 0; text-align: left; }
      .mmd-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 10px; font-size: 14px; }
      .mmd-row b { margin-left: auto; }
      .mmd-rank { width: 22px; text-align: center; font-weight: 800; color: #9ec5ff; }
      .mmd-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mmd-you { background: rgba(31, 111, 235, 0.22); }
      .mmd-starrow { display: flex; justify-content: center; gap: 6px; margin: 12px 0 2px; }
      .mmd-verdict { font-size: 16px; font-weight: 800; color: #ffd34d; margin-bottom: 2px; }
      .mmd-break { list-style: none; margin: 12px 0 4px; padding: 10px 12px; border-radius: 12px; background: rgba(8, 14, 30, 0.55); border: 1px solid #232c42; text-align: left; font-size: 13px; }
      .mmd-break li { display: flex; justify-content: space-between; gap: 10px; padding: 4px 0; }
      .mmd-break b.neg { color: #ff8a8a; }
      .mmd-break .mmd-total { margin-top: 4px; padding-top: 8px; border-top: 1px solid #232c42; font-size: 15px; }
      .mmd-nick { margin: 12px 0 2px; text-align: left; }
      .mmd-nickrow { display: flex; gap: 8px; margin-top: 4px; }
      .mmd-nickrow input { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 999px; border: 1px solid #232c42; background: #0d1324; color: #e6e9f0; font-size: 14px; }
      .mmd-card .mmd-nickrow button { width: auto; margin-top: 0; padding: 10px 18px; }
      .mmd-result { text-align: center; margin: 6px 0 10px; padding: 10px; border-radius: 14px; background: rgba(31, 111, 235, .12); border: 1px solid #1f6feb; }
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

  function boardHtml(board) {
    if (!board) return '';
    const top = Array.isArray(board.top) ? board.top : [];
    const row = (rank, name, score, you) => `<li class="mmd-row${you ? ' mmd-you' : ''}"><span class="mmd-rank">${esc(rank)}</span><span class="mmd-name">${esc(name)}</span><b>${esc(score)}</b></li>`;
    const rows = top.map(r => row(r.rank, r.you ? r.name + ' (you)' : r.name, r.score, r.you)).join('');
    const outside = board.you && !top.some(r => r.you) ? row(board.you.rank, 'You', board.you.score, true) : '';
    const body = rows ? `<ol class="mmd-board">${rows}${outside}</ol>` : '<p class="mmd-sub">No scores yet today. Be the first!</p>';
    const count = board.total ? `<p class="mmd-sub">${esc(board.total)} player${board.total === 1 ? '' : 's'} so far today</p>` : '';
    return `<div class="mmd-boardbox"><div class="mmd-kicker">TODAY'S TOP PLAYERS</div>${body}${count}</div>`;
  }

  function starsHtml(n) {
    const star = on => `<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" fill="${on ? '#ffd34d' : 'none'}" stroke="${on ? '#ffd34d' : '#3b4666'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    return `<div class="mmd-starrow">${[1, 2, 3].map(i => star(i <= n)).join('')}</div>`;
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

  function menuHtml(info, notice, board) {
    const sit = info.situation || {};
    const res = info.result;
    let status;
    if (res) {
      const rank = board && board.you ? `<p class="mmd-sub">Rank today: #${esc(board.you.rank)} of ${esc(board.total)}</p>` : '';
      const detail = Array.isArray(res.breakdown) && res.breakdown.length
        ? breakdownHtml(res.breakdown, res.score)
        : `<div class="mmd-stats">
            <div><b>${esc(res.stars)}/3</b><span>Stars</span></div>
            <div><b>${esc(res.needsCovered)}/${esc(res.totalNeeds)}</b><span>Needs covered</span></div>
            <div><b>$${esc(res.saved)}</b><span>Left</span></div>
          </div>`;
      status = `${starsHtml(res.stars)}
        <div class="mmd-verdict">${esc(verdict(res.stars))}</div>
        <div class="mmd-score">${esc(res.score)}</div>
        <div class="mmd-sub">Daily score</div>
        ${rank}
        ${detail}
        <button type="button" data-mmd-share>Share my score</button>`;
    } else if (info.locked) {
      status = '<p>Your official attempt for today has been used. A new challenge arrives every day.</p>';
    } else {
      status = '<button type="button" data-mmd-play>Play today\'s challenge</button>';
    }
    const ms = milestone(info.streak);
    return `<div class="mmd"><div class="mmd-card">
      <div class="mmd-kicker">DAILY CHALLENGE</div>
      <h3>${esc(sit.title || 'Today')}</h3>
      <p>${esc(sit.story || '')}</p>
      <p class="mmd-sub">Same challenge for everyone. One official attempt per day. Practice trips do not count.</p>
      ${info.streak > 0 ? `<span class="mmd-streak">Day streak: ${esc(info.streak)}</span>` : ''}
      ${ms ? `<p class="mmd-sub">${esc(ms)}</p>` : ''}
      ${notice ? `<p class="mmd-note">${esc(notice)}</p>` : ''}
      ${status}
      ${boardHtml(board)}
      <button type="button" class="mmd-alt" data-mmd-settings>Settings</button>
      <button type="button" class="mmd-alt" data-mmd-practice>Practice trip</button>
      <button type="button" class="mmd-alt" data-mmd-back>Back to Fun Center</button>
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

  // Adds the daily score, the streak and a Share button to the trip result card.
  function decorateResult(overlayEl, r) {
    const d = r && r.daily;
    if (!d) return;
    const card = overlayEl.querySelector('.mw-card');
    const title = card && card.querySelector('h3');
    if (!title) return;
    const box = document.createElement('div');
    box.className = 'mmd-result';
    box.innerHTML = `<div class="mmd-sub">DAILY CHALLENGE</div>
      <div class="mmd-score">${esc(d.score)}</div>
      <div class="mmd-sub">${d.streak > 1 ? esc(d.streak) + ' day streak. ' + esc(milestone(d.streak)) : 'Come back tomorrow for a new challenge'}</div>
      <button type="button" data-mmd-share>Share my score</button>`;
    title.insertAdjacentElement('afterend', box);
    box.querySelector('[data-mmd-share]').addEventListener('click', e => {
      share(shareText({ score: d.score, stars: r.stars, saved: r.saved }, d.dayKey, d.streak, 0), e.currentTarget);
    });
  }

  window.MiimiidMart.daily = { pickMode, decorateResult };
})();
