(function () {
  'use strict';
  if (window.__mmDailyInstalled) return;
  window.__mmDailyInstalled = true;

  /* ---------- wording (kept in one place so it can be translated later) ---------- */
  var T = {
    row: 'Daily goal',
    of: '{a} of {b} min',
    met: 'Goal reached today',
    left: '{n} more min to reach your goal',
    pageTitle: 'Daily goal',
    goalLabel: 'Daily goal',
    streakLabel: 'Streak',
    currentStreak: 'Current streak',
    freezes: 'Streak freezes',
    days: '{n} days',
    day: '1 day',
    freezeNote: 'A streak freeze keeps your streak alive if you miss a day. It is used automatically, and only to protect a streak of 3 days or more. You start with 1 and earn another every 7 days of streak, up to 2.',
    minutes: '{n} minutes',
    updated: 'Daily goal updated',
    reached: 'Daily goal reached',
    freezeUsed: 'Streak freeze used. Your streak is safe.',
    freezeEarned: 'You earned a streak freeze',
    error: 'Could not save. Check your connection and try again.'
  };

  function t(key, vars) {
    var text = T[key] || '';
    Object.keys(vars || {}).forEach(function (k) { text = text.replace('{' + k + '}', vars[k]); });
    return text;
  }

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-daily {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 14px;
  margin: 0; padding: 14px 16px; border: 1px solid #1f2a44; border-radius: 16px; background: #111a2e;
  color: #f1f5f9; font-family: inherit; text-align: left; cursor: pointer;
  transition: background 0.18s ease, transform 0.15s ease;
}
.mm-daily:active { transform: scale(0.985); background: #16213a; }
.mm-ring { position: relative; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; }
.mm-ring > svg { display: block; transform: rotate(-90deg); }
.mm-ring-center { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #34d399; }
.mm-daily-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.mm-daily-text small { color: #94a3b8; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
.mm-daily-text strong { font-size: 1.05rem; font-weight: 700; }
.mm-daily-text em { font-style: normal; color: #94a3b8; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mm-daily-chip {
  flex: 0 0 auto; display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px;
  border-radius: 999px; background: rgba(125, 211, 252, 0.1); color: #7dd3fc; font-size: 0.85rem; font-weight: 700;
}
.mm-daily-chev { flex: 0 0 auto; color: #64748b; display: inline-flex; }

.mm-dg { max-width: 560px; margin: 0 auto; }
.mm-dg-hero { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 6px 0 22px; text-align: center; }
.mm-dg-hero strong { color: #f8fafc; font-size: 1.5rem; font-weight: 800; }
.mm-dg-hero span { color: #94a3b8; font-size: 0.92rem; }
.mm-dg-note { margin: 14px 4px 0; color: #8b95ad; font-size: 0.85rem; line-height: 1.55; }
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  var SNOW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>';
  var CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#4da3ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
  var TICK = '<svg viewBox="0 0 24 24" width="REPLACE" height="REPLACE" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  function api(url, options) {
    var settings = Object.assign({
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }, options || {});
    return fetch(url, settings).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (data) {
        return { ok: response.ok, status: response.status, data: data };
      });
    });
  }

  function timezone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  }

  function uid() {
    var u = window.MIIMIID_CURRENT_USER || window.currentUser || {};
    return u.id || u._id || '';
  }

  function toast(text) {
    var a = window.MiimiidAccount;
    if (a && a.toast) a.toast(text);
  }

  function ring(size, stroke, pct, met, centerHtml) {
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var offset = c * (1 - Math.max(0, Math.min(1, pct)));
    var color = met ? '#34d399' : '#4da3ff';
    return '<span class="mm-ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#1c2640" stroke-width="' + stroke + '"/>' +
        '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
      '</svg>' +
      (centerHtml ? '<span class="mm-ring-center">' + centerHtml + '</span>' : '') +
    '</span>';
  }

  function pctOf(d) { return d.dailyMinutes > 0 ? d.minutesToday / d.dailyMinutes : 0; }

  var latest = null;

  // Remember today's numbers so Home can show them instantly next time
  function cacheKey() { return 'mmDailyCache:' + uid(); }

  function readCache() {
    try {
      var saved = JSON.parse(localStorage.getItem(cacheKey()) || 'null');
      return saved && saved.day === new Date().toDateString() ? saved.data : null;
    } catch (e) { return null; }
  }

  function writeCache(d) {
    try {
      localStorage.setItem(cacheKey(), JSON.stringify({ day: new Date().toDateString(), data: d }));
    } catch (e) {}
  }

  /* ---------- the row on Home ---------- */
  function paintRow(row, d) {
    var met = d.goalMet;
    var tick = TICK.replace(/REPLACE/g, '18');
    row.innerHTML =
      ring(46, 5, pctOf(d), met, met ? tick : '') +
      '<span class="mm-daily-text"><small>' + t('row') + '</small>' +
        '<strong>' + t('of', { a: Math.min(d.minutesToday, d.dailyMinutes), b: d.dailyMinutes }) + '</strong>' +
        '<em>' + (met ? t('met') : t('left', { n: Math.max(0, d.dailyMinutes - d.minutesToday) })) + '</em></span>' +
      '<span class="mm-daily-chip" aria-label="Streak freezes">' + SNOW + d.freezes + '</span>' +
      '<span class="mm-daily-chev">' + CHEVRON + '</span>';
  }

  function announce(d) {
    var key = 'mmGoalMet:' + uid() + ':' + new Date().toDateString();
    var already = false;
    try { already = localStorage.getItem(key) === '1'; } catch (e) {}

    if (d.freezeUsed > 0) { toast(t('freezeUsed')); return; }
    if (d.freezeEarned > 0) { toast(t('freezeEarned')); return; }
    if (d.goalMet && !already) {
      try { localStorage.setItem(key, '1'); } catch (e) {}
      toast(t('reached'));
    }
  }

  function load(row) {
    api('/api/learn/daily?tz=' + encodeURIComponent(timezone())).then(function (r) {
      var d = r.ok && r.data && r.data.data;
      if (!d) { if (row.parentNode) row.parentNode.removeChild(row); return; }
      latest = d;
      paintRow(row, d);
      announce(d);
    }).catch(function () {
      if (row.parentNode) row.parentNode.removeChild(row);
    });
  }

  function inject() {
    var content = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
    if (!content || content.querySelector('.mm-daily') || !uid()) return;

    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'mm-daily';
    // Placeholder with the same height, so nothing jumps when the numbers arrive
    paintRow(row, { dailyMinutes: 10, minutesToday: 0, goalMet: false, freezes: 1 });
    row.querySelector('.mm-daily-text strong').textContent = '\u00a0';
    row.querySelector('.mm-daily-text em').textContent = '\u00a0';
    row.addEventListener('click', openPage);
    content.insertBefore(row, content.firstChild);

    load(row);
  }

  /* ---------- the Daily goal page ---------- */
  function openPage() {
    var account = window.MiimiidAccount;
    if (!account || typeof account.openSub !== 'function' || !latest) return;
    var d = latest;
    var met = d.goalMet;

    account.openSub(t('pageTitle'), function (body) {
      var options = [5, 10, 15, 20].map(function (m) {
        return '<button type="button" class="mm-lrow" data-min="' + m + '"><span class="mm-lrow-label">' + t('minutes', { n: m }) + '</span>' +
          (d.dailyMinutes === m ? CHECK : '') + '</button>';
      }).join('');

      body.innerHTML =
        '<div class="mm-dg">' +
          '<div class="mm-dg-hero">' +
            ring(132, 10, pctOf(d), met, met ? TICK.replace(/REPLACE/g, '40') : '') +
            '<strong>' + t('of', { a: Math.min(d.minutesToday, 999), b: d.dailyMinutes }) + '</strong>' +
            '<span>' + (met ? t('met') : t('left', { n: Math.max(0, d.dailyMinutes - d.minutesToday) })) + '</span>' +
          '</div>' +
          '<div class="mm-label">' + t('goalLabel') + '</div>' +
          '<div class="mm-list">' + options + '</div>' +
          '<div class="mm-label" style="margin-top:28px">' + t('streakLabel') + '</div>' +
          '<div class="mm-list">' +
            '<div class="mm-lrow is-static"><span class="mm-lrow-label">' + t('currentStreak') + '</span><span class="mm-lrow-value">' + (d.streak === 1 ? t('day') : t('days', { n: d.streak })) + '</span></div>' +
            '<div class="mm-lrow is-static"><span class="mm-lrow-label">' + t('freezes') + '</span><span class="mm-lrow-value">' + d.freezes + ' / ' + d.maxFreezes + '</span></div>' +
          '</div>' +
          '<p class="mm-dg-note">' + t('freezeNote') + '</p>' +
        '</div>';

      body.onclick = function (event) {
        var btn = event.target.closest ? event.target.closest('[data-min]') : null;
        if (!btn) return;
        var minutes = Number(btn.getAttribute('data-min'));
        if (minutes === d.dailyMinutes) return;

        api('/api/learn/daily/goal', { method: 'POST', body: JSON.stringify({ dailyMinutes: minutes }) }).then(function (r) {
          if (r.ok) {
            latest.dailyMinutes = minutes;
            latest.goalMet = latest.minutesToday >= minutes;
            var row = document.querySelector('.mm-daily');
            if (row) paintRow(row, latest);
            window.MiimiidDrawer.close();
            toast(t('updated'));
          } else {
            toast((r.data && r.data.message) || t('error'));
          }
        }).catch(function () { toast(t('error')); });
      };
    });
  }

  /* ---------- keep it fresh ---------- */
  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(inject).observe(dash, { childList: true });
    inject();
  }

  window.MiimiidDaily = {
    refresh: function () {
      var row = document.querySelector('.mm-daily');
      if (row) load(row);
    }
  };

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    var row = document.querySelector('.mm-daily');
    if (row) load(row);
  });
})();
