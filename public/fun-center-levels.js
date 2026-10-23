/*
 * MIIMIID MART LEVELS (client)
 * The level map, the level briefing screen and the level result.
 * The server owns every rule (budget, clock, events, stars, unlocks); this file only shows them.
 *
 * Used by fun-center-world.js:
 *   MiimiidMart.levels.pick(content, request, notice, dailyPick)  -> { mode, levelId }
 *   MiimiidMart.levels.decorateResult(overlay, result)
 */
(function () {
  'use strict';
  window.MiimiidMart = window.MiimiidMart || {};

  var NO_OVERLAY = { 'X-Continue-Loading': 'false' };
  var nextPreset = null;
  var API = {};                // becomes MiimiidMart.levels; API.current is the level being played (read by mart-themes.js)

  var ICONS = {
    basket: '<path d="M5 9h14l-1.5 9a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7L5 9z"/><path d="M9 9l3-5 3 5"/>',
    tag: '<path d="M3 3h8l10 10-8 8L3 11V3z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
    medicine: '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2c2.7.2 4.5 2.3 4.5 5.3"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1.2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    scan: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-1.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.6 2.5 1.6c0 2.4-5 1.2-5 3.6 0 1 1 1.6 2.5 1.6s2.5-.6 2.5-1.5"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4"/><path d="M12 13v4M8 20h8M9 17h6"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    circle: '<circle cx="12" cy="12" r="9"/>'
  };
  var LEVEL_ICON = { 1: 'basket', 2: 'tag', 3: 'medicine', 4: 'users', 5: 'home', 6: 'bolt' };
  function ico(name, cls) {
    return '<svg class="mlv-ico' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function levelIco(n, cls) { return ico(LEVEL_ICON[n] || 'basket', cls); }

  function accent(n) {
    try { return (window.MiimiidMartThemes && window.MiimiidMartThemes.accent(n)) || ''; } catch (e) { return ''; }
  }
  function setCurrent(level) {
    API.current = level ? { id: level.id, n: level.n, title: level.title, mission: level.mission, goals: (level.goals || []).slice(0, 3) } : null;
  }       // set by the result screen: open this level's briefing straight away

  var ITEM_NAMES = {
    milk: 'Milk', bread: 'Bread', eggs: 'Eggs', pasta: 'Pasta', apple: 'Apples', carrot: 'Carrots',
    water: 'Water', medicine: 'Medicine', movie: 'Movie ticket'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clock(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function stars(n, big) {
    var out = '';
    for (var i = 0; i < 3; i++) out += '<span class="' + (i < n ? 'on' : 'off') + '">★</span>';
    return '<span class="mlv-stars' + (big ? ' big' : '') + '">' + out + '</span>';
  }

  function css() {
    if (document.getElementById('mart-levels-css')) return;
    var st = document.createElement('style');
    st.id = 'mart-levels-css';
    st.textContent =
      '.mlv { color: #e6e9f0; padding: 4px 2px 24px; }' +
      '.mlv-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }' +
      '.mlv-back { background: #151d33; border: 1px solid #232c42; color: #cfd6e6; border-radius: 12px; padding: 8px 12px; font-size: 14px; cursor: pointer; }' +
      '.mlv-title { font-size: 24px; font-weight: 800; letter-spacing: .01em; }' +
      '.mlv-title span { background: linear-gradient(90deg, #7ec0ff, #ffffff 55%, #ffd98a); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }' +
      '.mlv-sub { margin: 4px 0 12px; color: #9aa4bd; font-size: 13px; line-height: 1.45; }' +
      '.mlv-total { display: inline-flex; align-items: center; gap: 6px; background: #151d33; border: 1px solid #232c42; border-radius: 999px; padding: 5px 12px; font-size: 12px; color: #ffd34d; margin-bottom: 12px; }' +
      '.mlv-notice { background: #2a1a1f; border: 1px solid #5b2a35; color: #ffb4bf; border-radius: 12px; padding: 10px 12px; font-size: 13px; margin-bottom: 12px; }' +
      '.mlv-path { position: relative; display: flex; flex-direction: column; gap: 12px; padding-left: 0; }' +
      '.mlv-node { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; cursor: pointer; color: inherit;' +
      '  background: linear-gradient(180deg, #151d36, #101729); border: 1px solid #263150; border-radius: 18px; padding: 12px 14px;' +
      '  animation: mlvIn .45s cubic-bezier(.2,.9,.3,1) both; }' +
      '.mlv-node:active { transform: scale(.99); }' +
      '.mlv-node.next { border-color: #3d89ff; box-shadow: 0 0 0 1px rgba(61,137,255,.4), 0 10px 30px rgba(31,111,235,.25); }' +
      '.mlv-node.cleared { border-color: #3b6b57; }' +
      '.mlv-node.locked { opacity: .55; filter: grayscale(.4); }' +
      '.mlv-num { flex: 0 0 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px;' +
      '  background: #1b2544; border: 2px solid #2d3a63; color: #cfd6e6; }' +
      '.mlv-node.next .mlv-num { background: linear-gradient(180deg, #3d89ff, #1f6feb); border-color: #8cc4ff; color: #fff; }' +
      '.mlv-node.cleared .mlv-num { background: #1f3b31; border-color: #4fbf8f; color: #8ff0c4; }' +
      '.mlv-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }' +
      '.mlv-body b { font-size: 16px; }' +
      '.mlv-body small { color: #9aa4bd; font-size: 12px; line-height: 1.35; }' +
      '.mlv-tag { display: inline-block; font-size: 10px; font-weight: 800; letter-spacing: .08em; color: #8cc4ff; margin-bottom: 1px; }' +
      '.mlv-go { color: #6f7ba0; font-size: 22px; }' +
      '.mlv-stars { letter-spacing: 2px; font-size: 16px; }' +
      '.mlv-stars.big { font-size: 30px; letter-spacing: 6px; }' +
      '.mlv-stars .on { color: #ffd34d; text-shadow: 0 0 10px rgba(255,211,77,.45); }' +
      '.mlv-stars .off { color: #2f3a5c; }' +
      '.mlv-alt { display: block; width: 100%; margin-top: 16px; background: transparent; border: 1px solid #2b3556; color: #cfd6e6; border-radius: 16px; padding: 13px; font-size: 14px; cursor: pointer; }' +
      '.mlv-hero { text-align: center; padding: 14px 6px 8px; }' +
      '.mlv-kicker { margin-top: 8px; font-size: 11px; font-weight: 800; letter-spacing: .14em; color: #8cc4ff; }' +
      '.mlv-hero h2 { margin: 4px 0 6px; font-size: 26px; }' +
      '.mlv-hero p { margin: 0 auto; max-width: 320px; color: #aeb7cf; font-size: 14px; line-height: 1.45; }' +
      '.mlv-mission { margin: 12px 0; padding: 12px 14px; border-radius: 14px; background: #131c35; border: 1px solid #263150; font-size: 14px; line-height: 1.45; }' +
      '.mlv-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }' +
      '.mlv-chip { background: #151d33; border: 1px solid #263150; border-radius: 999px; padding: 6px 11px; font-size: 12px; color: #cfd6e6; }' +
      '.mlv-chip.warn { border-color: #5b3a2a; color: #ffc9a3; }' +
      '.mlv-list { margin: 0 0 12px; font-size: 13px; color: #aeb7cf; line-height: 1.5; }' +
      '.mlv-list b { color: #e6e9f0; }' +
      '.mlv-goals { background: #111a30; border: 1px solid #263150; border-radius: 16px; padding: 12px 14px; margin-bottom: 14px; }' +
      '.mlv-goals h4 { margin: 0 0 8px; font-size: 12px; letter-spacing: .1em; color: #9aa4bd; font-weight: 800; }' +
      '.mlv-goal { display: flex; gap: 10px; align-items: flex-start; padding: 6px 0; font-size: 14px; line-height: 1.35; }' +
      '.mlv-goal i { font-style: normal; color: #ffd34d; }' +
      '.mlv-start { display: block; width: 100%; border: 0; border-radius: 16px; padding: 15px; font-size: 16px; font-weight: 800; color: #fff; cursor: pointer;' +
      '  background: linear-gradient(180deg, #3d89ff, #1f6feb); box-shadow: 0 10px 26px rgba(31,111,235,.42), inset 0 1px 0 rgba(255,255,255,.28); }' +
      '.mlv-fine { text-align: center; color: #8b95b0; font-size: 12px; margin-top: 10px; }' +
      // result banner
      '.mlv-res { text-align: center; border-radius: 16px; padding: 12px; margin: 8px 0 10px; background: linear-gradient(180deg, #162a3d, #101c30); border: 1px solid #2f5a7a; }' +
      '.mlv-res.no { background: linear-gradient(180deg, #2a1d28, #1a1420); border-color: #5b3a4a; }' +
      '.mlv-res-top { font-size: 11px; font-weight: 800; letter-spacing: .12em; color: #8cc4ff; }' +
      '.mlv-res-title { font-size: 22px; font-weight: 800; margin: 4px 0; }' +
      '.mlv-res-goals { text-align: left; margin-top: 8px; font-size: 13px; }' +
      '.mlv-res-goals div { padding: 4px 0; border-top: 1px solid rgba(255,255,255,.06); }' +
      '.mlv-res-goals small { display: block; color: #9aa4bd; }' +
      '.mlv-res-bonus { margin-top: 8px; color: #ffd34d; font-size: 13px; font-weight: 700; }' +
      '.mlv-node:not(.locked) .mlv-tag { color: var(--acc, #8cc4ff); }' +
      '.mlv-node:not(.locked):not(.next):not(.cleared) .mlv-num { border-color: var(--acc, #2d3a63); }' +
      '.mlv-ico { width: 1.15em; height: 1.15em; flex: none; vertical-align: -.2em; }' +
      '.mlv-body b { display: flex; align-items: center; gap: 7px; }' +
      '.mlv-body b .mlv-ico { color: var(--acc, #8cc4ff); width: 1.1em; height: 1.1em; }' +
      '.mlv-chip { display: inline-flex; align-items: center; gap: 6px; }' +
      '.mlv-mission { display: flex; gap: 10px; align-items: flex-start; }' +
      '.mlv-mission .mlv-ico { color: var(--acc, #8cc4ff); margin-top: 1px; }' +
      '.mlv-goal .mlv-ico { color: #ffd34d; margin-right: 2px; }' +
      '.mlv-res-goals .mlv-ico { color: #4fbf8f; margin-right: 6px; }' +
      '.mlv-res-goals .mlv-ico.off { color: #4a557a; }' +
      '.mlv-res-bonus { display: flex; align-items: center; justify-content: center; gap: 6px; }' +
      '.mlv-res-bonus .mlv-ico { color: #ffd34d; }' +
      '.mlv-fine { display: flex; align-items: center; justify-content: center; gap: 6px; }' +
      '.mlv-sublock { display: flex; align-items: center; gap: 6px; }' +
      '.mlv-tile { width: 76px; height: 76px; margin: 0 auto; border-radius: 24px; display: flex; align-items: center; justify-content: center; color: var(--acc, #8cc4ff);' +
      '  background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.01)); border: 1px solid var(--acc, #2d3a63); box-shadow: 0 8px 26px rgba(0,0,0,.35), 0 0 28px -6px var(--acc, rgba(61,137,255,.5)); }' +
      '.mlv-tile .mlv-ico { width: 38px; height: 38px; }' +
      '.mlv-hero .mlv-kicker { color: var(--acc, #8cc4ff); }' +
      '.mlv-mission { border-left: 3px solid var(--acc, #263150); }' +
      '@keyframes mlvIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }' +
      '@media (prefers-reduced-motion: reduce) { .mlv-node { animation: none; } }';
    document.head.appendChild(st);
  }

  function chipsFor(level) {
    var chips = [
      '<span class="mlv-chip">' + ico('wallet') + 'Budget $' + level.budget + '</span>',
      '<span class="mlv-chip">' + ico('clock') + clock(level.seconds) + '</span>',
      '<span class="mlv-chip">' + ico('scan') + level.scans + ' scans</span>'
    ];
    if (level.events && level.events.sale) chips.push('<span class="mlv-chip warn">' + ico('tag') + 'Flash sale</span>');
    if (level.events && level.events.hike) chips.push('<span class="mlv-chip warn">' + ico('trend') + 'Price rise</span>');
    if (level.events && level.events.rival) chips.push('<span class="mlv-chip warn">' + ico('flag') + 'Rival shopper</span>');
    return chips.join('');
  }

  // ---------- the level map ----------
  function showMap(content, levels, notice) {
    return new Promise(function (resolve) {
      var total = 0;
      var nextId = null;
      levels.forEach(function (l) {
        total += l.bestStars || 0;
        if (!nextId && l.unlocked && (l.bestStars || 0) < 2) nextId = l.id;
      });
      var nodes = levels.map(function (l, i) {
        var cls = 'mlv-node' + (l.unlocked ? '' : ' locked') + ((l.bestStars || 0) >= 2 ? ' cleared' : '') + (l.id === nextId ? ' next' : '');
        var acc = accent(l.n);
        var sub = l.unlocked ? esc(l.story) : '<span class="mlv-sublock">' + ico('lock') + esc(l.unlockHint) + '</span>';
        return '<button type="button" class="' + cls + '" data-lv="' + esc(l.id) + '" style="animation-delay:' + (i * 70) + 'ms' + (acc ? ';--acc:' + acc : '') + '">' +
          '<span class="mlv-num">' + l.n + '</span>' +
          '<span class="mlv-body">' + (l.id === nextId ? '<span class="mlv-tag">PLAY NEXT</span>' : '') +
          '<b>' + levelIco(l.n) + '<span>' + esc(l.title) + '</span></b><small>' + sub + '</small>' + (l.unlocked ? stars(l.bestStars || 0) : '') + '</span>' +
          '<span class="mlv-go">' + (l.unlocked ? '›' : '') + '</span></button>';
      }).join('');
      content.innerHTML =
        '<div class="mlv">' +
        '<div class="mlv-top"><button type="button" class="mlv-back" data-back>‹ Back</button><div class="mlv-title"><span>Mart Levels</span></div></div>' +
        '<p class="mlv-sub">Every level is a new money challenge with its own rules. Earn 2 stars to unlock the next one.</p>' +
        '<div class="mlv-total">★ ' + total + ' / ' + (levels.length * 3) + ' stars</div>' +
        (notice ? '<div class="mlv-notice">' + esc(notice) + '</div>' : '') +
        '<div class="mlv-path">' + nodes + '</div>' +
        '<button type="button" class="mlv-alt" data-daily>Daily Challenge and practice trip</button>' +
        '</div>';
      content.querySelector('[data-back]').addEventListener('click', function () { resolve({ type: 'back' }); });
      content.querySelector('[data-daily]').addEventListener('click', function () { resolve({ type: 'daily' }); });
      var nodeEls = content.querySelectorAll('[data-lv]');
      for (var i = 0; i < nodeEls.length; i++) {
        (function (el) {
          el.addEventListener('click', function () {
            var level = levels.filter(function (l) { return l.id === el.getAttribute('data-lv'); })[0];
            if (level && level.unlocked) resolve({ type: 'level', level: level });
          });
        })(nodeEls[i]);
      }
    });
  }

  // ---------- the level briefing ----------
  function showBrief(content, level) {
    return new Promise(function (resolve) {
      var list = (level.hints || []).map(function (id) { return ITEM_NAMES[id] || id; }).join(', ');
      var goals = (level.goals || []).map(function (g) { return '<div class="mlv-goal">' + ico('circle', 'goal') + '<span>' + esc(g) + '</span></div>'; }).join('');
      content.innerHTML =
        '<div class="mlv">' +
        '<div class="mlv-top"><button type="button" class="mlv-back" data-back>‹ Levels</button></div>' +
        '<div class="mlv-hero"' + (accent(level.n) ? ' style="--acc:' + accent(level.n) + '"' : '') + '><div class="mlv-tile">' + levelIco(level.n) + '</div>' +
        '<div class="mlv-kicker">LEVEL ' + level.n + '</div><h2>' + esc(level.title) + '</h2><p>' + esc(level.story) + '</p></div>' +
        '<div class="mlv-mission">' + ico('target') + '<span>' + esc(level.mission) + '</span></div>' +
        '<div class="mlv-chips">' + chipsFor(level) + '</div>' +
        (list ? '<div class="mlv-list"><b>Your list:</b> ' + esc(list) + '</div>' : '') +
        '<div class="mlv-goals"><h4>EARN STARS</h4>' + goals + '</div>' +
        '<button type="button" class="mlv-start" data-start>Start level ' + level.n + '</button>' +
        '<div class="mlv-fine">First clear pays +' + level.bonusCoins + ' bonus coins ' + ico('coin') + '</div>' +
        '</div>';
      content.querySelector('[data-back]').addEventListener('click', function () { resolve(false); });
      content.querySelector('[data-start]').addEventListener('click', function () { resolve(true); });
    });
  }

  async function pick(content, request, notice, dailyPick) {
    css();
    setCurrent(null);            // practice trips and the Daily Challenge get no level theme
    var levels = null;
    try {
      var data = await request('/api/fun-center/levels', { headers: NO_OVERLAY });
      levels = data && data.levels;
    } catch (e) {
      console.error('levels failed to load, using the normal menu:', e);
    }
    if (!Array.isArray(levels) || !levels.length) {
      var fallback = await dailyPick();
      return { mode: fallback, levelId: null };
    }

    if (nextPreset) {
      var presetId = nextPreset;
      nextPreset = null;
      var preset = levels.filter(function (l) { return l.id === presetId; })[0];
      if (preset && preset.unlocked) {
        var go = await showBrief(content, preset);
        if (go) { setCurrent(preset); return { mode: 'level', levelId: preset.id }; }
      }
    }

    var message = notice || '';
    for (;;) {
      var choice = await showMap(content, levels, message);
      message = '';
      if (choice.type === 'back') return { mode: 'back', levelId: null };
      if (choice.type === 'daily') {
        var mode = await dailyPick();
        if (mode === 'back') continue;            // back from the daily menu returns to the map
        return { mode: mode, levelId: null };
      }
      var ok = await showBrief(content, choice.level);
      if (ok) { setCurrent(choice.level); return { mode: 'level', levelId: choice.level.id }; }
    }
  }

  // ---------- the level result (added to the normal result card) ----------
  function decorateResult(o, r) {
    try {
      if (!r || !r.level) return;
      css();
      var L = r.level;
      var cleared = L.stars >= 2;
      var title = L.stars === 3 ? 'Perfect level!' : (cleared ? 'Level cleared!' : 'Not cleared yet');
      var goals = (r.starRows || []).map(function (row) {
        return '<div>' + (row.earned ? ico('check') : ico('circle', 'off')) + esc(row.label) + (row.earned ? '' : '<small>' + esc(row.hint) + '</small>') + '</div>';
      }).join('');
      var extra = '';
      if (L.bonusCoins > 0) extra += '<div class="mlv-res-bonus">+' + L.bonusCoins + ' bonus coins for the level ' + ico('coin') + '</div>';
      if (L.nextUnlocked && L.next) extra += '<div class="mlv-res-bonus">Level ' + L.next.n + ' unlocked ' + ico('unlock') + '</div>';
      if (L.finalLevel && cleared) extra += '<div class="mlv-res-bonus">You finished the whole campaign! ' + ico('trophy') + '</div>';
      if (!cleared) extra += '<div class="mlv-res-sub" style="color:#9aa4bd;font-size:13px;margin-top:6px">Earn 2 stars to move on.</div>';

      var banner = document.createElement('div');
      banner.className = 'mlv-res' + (cleared ? '' : ' no');
      if (cleared && accent(L.n)) banner.style.borderColor = accent(L.n);
      banner.innerHTML =
        '<div class="mlv-res-top">LEVEL ' + L.n + ' · ' + esc(L.title).toUpperCase() + '</div>' +
        '<div class="mlv-res-title">' + title + '</div>' + stars(L.stars, true) +
        '<div class="mlv-res-goals">' + goals + '</div>' + extra;
      var heading = o.querySelector('h3');
      if (heading && heading.parentNode) heading.parentNode.insertBefore(banner, heading.nextSibling);
      else o.insertBefore(banner, o.firstChild);

      var again = o.querySelector('[data-again]');
      if (!again) return;
      again.textContent = 'Level map';
      again.classList.add('mw-alt');
      function addButton(label, id, primary) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        if (!primary) b.className = 'mw-alt';
        b.addEventListener('click', function () { nextPreset = id; again.click(); });
        again.parentNode.insertBefore(b, again);
      }
      if (!(L.nextUnlocked && L.next) || L.stars < 3) addButton('Retry level ' + L.n, L.id, !(L.nextUnlocked && L.next));
      if (L.nextUnlocked && L.next) {
        var nb = document.createElement('button');
        nb.type = 'button';
        nb.textContent = 'Next: Level ' + L.next.n + ' ›';
        nb.addEventListener('click', function () { nextPreset = L.next.id; again.click(); });
        again.parentNode.insertBefore(nb, again.parentNode.querySelector('[data-learnbtn]') || again);
      }
    } catch (e) {
      console.error('level result failed:', e);
    }
  }

  API.pick = pick;
  API.decorateResult = decorateResult;
  window.MiimiidMart.levels = API;
})();
