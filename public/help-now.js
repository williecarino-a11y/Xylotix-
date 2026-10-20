/* =========================================================
   MIIMIID "HELP WITH A REAL SITUATION"
   Start from the problem, not the course list.
   - Home: a short flat list of urgent situations + "See all"
   - Full list: every situation, grouped, opens the right lesson
   Lessons are found by slug first, then by title, so nothing on
   the server changes. Loaded after home-stats.js and
   learn-journey.js in index.html.
   ========================================================= */
(function () {
  'use strict';
  if (window.__mmHelpNowInstalled) return;
  window.__mmHelpNowInstalled = true;

  var COURSE = 'Money Basics';

  /* ---------- the situations ----------
     key  = start of the lesson title (matched loosely)
     slug = lesson slug, tried first when the app provides one
     min  = minutes shown on the row                              */
  var GROUPS = [
    { id: 'trouble', label: 'Money trouble',      color: '#fb7185' },
    { id: 'protect', label: 'Protect yourself',   color: '#38bdf8' },
    { id: 'life',    label: 'Life events',        color: '#a78bfa' },
    { id: 'daily',   label: 'Everyday decisions', color: '#34d399' }
  ];

  var SITUATIONS = [
    { id: 'income-drop', group: 'trouble', icon: 'down', min: 30,
      label: 'My income just dropped',
      slug: 'when-your-income-suddenly-drops', key: 'when your income suddenly drops' },
    { id: 'missed', group: 'trouble', icon: 'clock', min: 35,
      label: "I'm behind on a payment",
      slug: 'what-happens-when-you-miss-debt-payments', key: 'what happens when you miss debt payments' },
    { id: 'collector', group: 'trouble', icon: 'phone', min: 30,
      label: 'A debt collector is calling',
      slug: 'a-debt-collector-is-calling', key: 'a debt collector is calling' },
    { id: 'debt', group: 'trouble', icon: 'link', min: 40,
      label: 'I want to get out of debt',
      slug: 'how-to-get-out-of-debt-without-making-the-problem-worse', key: 'how to get out of debt' },
    { id: 'bills', group: 'trouble', icon: 'receipt', min: 30,
      label: 'My bills feel too high',
      slug: 'how-to-negotiate-your-bills', key: 'how to negotiate your bills' },
    { id: 'low-income', group: 'trouble', icon: 'dollar', min: 35,
      label: "I can't save much on my income",
      slug: 'how-to-save-money-when-income-is-low', key: 'how to save money when your income is low' },

    { id: 'scam', group: 'protect', icon: 'shield', min: 30,
      label: 'I got a suspicious call or message',
      slug: 'scam-calls-texts-and-messages', key: 'scam calls texts and messages' },
    { id: 'stolen', group: 'protect', icon: 'lock', min: 30,
      label: 'My phone or wallet was stolen',
      slug: 'your-wallet-or-phone-is-stolen-the-first-hour', key: 'your wallet or phone is stolen' },
    { id: 'betting', group: 'protect', icon: 'dice', min: 30,
      label: "I'm betting more than I planned",
      slug: 'betting-gambling-and-get-rich-apps', key: 'betting gambling and get rich apps' },
    { id: 'insurance', group: 'protect', icon: 'umbrella', min: 30,
      label: 'Do I need insurance?',
      slug: 'insurance-in-plain-words', key: 'insurance in plain words' },
    { id: 'cosign', group: 'protect', icon: 'pen', min: 40,
      label: 'Someone asked me to co-sign a loan',
      slug: 'co-signing-guarantees-and-borrowing-for-someone-else', key: 'co signing guarantees and borrowing' },

    { id: 'lump', group: 'life', icon: 'wallet', min: 30,
      label: 'I just received a lump sum',
      slug: 'you-got-a-lump-sum-what-to-do-first', key: 'you got a lump sum' },
    { id: 'family', group: 'life', icon: 'users', min: 30,
      label: 'My family needs my help with money',
      slug: 'supporting-family-without-going-broke', key: 'supporting family without going broke' },
    { id: 'event', group: 'life', icon: 'calendar', min: 30,
      label: 'A wedding or funeral is coming up',
      slug: 'weddings-funerals-and-big-family-events-without-debt', key: 'weddings funerals and big family events' },
    { id: 'sharing', group: 'life', icon: 'split', min: 30,
      label: 'I share money with a partner or roommate',
      slug: '', key: 'sharing money' },

    { id: 'overspend', group: 'daily', icon: 'bag', min: 35,
      label: 'I keep overspending',
      slug: 'how-to-stop-impulse-spending-without-feeling-deprived', key: 'how to stop impulse spending' },
    { id: 'subs', group: 'daily', icon: 'repeat', min: 30,
      label: 'I keep paying for things I forgot about',
      slug: '', key: 'subscriptions fees and auto renewals' },
    { id: 'where', group: 'daily', icon: 'search', min: 30,
      label: "I don't know where my money goes",
      slug: 'where-does-your-money-actually-go', key: 'where does your money actually go' },
    { id: 'plan', group: 'daily', icon: 'sliders', min: 35,
      label: 'I need a spending plan that works',
      slug: 'how-to-build-a-simple-spending-plan-that-actually-works', key: 'how to build a simple spending plan' },
    { id: 'afford', group: 'daily', icon: 'help', min: 35,
      label: "I'm not sure I can afford something",
      slug: 'how-to-know-if-you-can-actually-afford-something', key: 'how to know if you can actually afford' }
  ];

  // Shown on Home. The rest live behind "See all".
  var HOME_IDS = ['income-drop', 'missed', 'collector', 'scam'];

  /* ---------- icons (24x24 outline, same stroke as the rest of the app) ---------- */
  function svg(inner) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  var ICONS = {
    down: svg('<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
    phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
    link: svg('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
    receipt: svg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>'),
    dollar: svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
    shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    dice: svg('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="8.5" cy="15.5" r="1"/><circle cx="15.5" cy="15.5" r="1"/>'),
    umbrella: svg('<path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/>'),
    pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    wallet: svg('<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>'),
    users: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
    calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
    split: svg('<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>'),
    bag: svg('<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
    repeat: svg('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
    sliders: svg('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
    help: svg('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>')
  };

  var CHEVRON = '<svg class="mm-help-chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

  /* ---------- styles ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-help { margin: 0; }
.mm-help-head { display: flex; align-items: center; justify-content: space-between; margin: 0 2px 10px; }
.mm-help-title { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: #4da3ff; }
.mm-help-all { background: none; border: 0; padding: 6px 2px; font: inherit; font-size: 0.85rem; font-weight: 600; color: #94a3b8; cursor: pointer; }
.mm-help-all:active { color: #e2e8f0; }

.mm-help-list {
  background: #111a2e; border: 1px solid #1f2a44; border-radius: 16px; overflow: hidden;
}
.mm-help-row {
  width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 14px;
  padding: 13px 16px; min-height: 64px; background: transparent; border: 0;
  border-top: 1px solid #1f2a44; color: #f1f5f9; font-family: inherit; text-align: left; cursor: pointer;
  transition: background 0.18s ease;
  -webkit-tap-highlight-color: transparent;
}
.mm-help-list > .mm-help-row:first-child,
.mm-help-group-list > .mm-help-row:first-child { border-top: 0; }
.mm-help-row:active { background: #16213a; }
.mm-help-row[disabled] { opacity: 0.6; cursor: default; }

.mm-help-ico {
  flex: 0 0 auto; width: 38px; height: 38px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  color: var(--mm-help-c, #94a3b8);
  background: color-mix(in srgb, var(--mm-help-c, #94a3b8) 14%, transparent);
}
.mm-help-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mm-help-label { font-size: 1rem; font-weight: 600; line-height: 1.3; }
.mm-help-sub { font-size: 0.8rem; color: #94a3b8; }
.mm-help-chev { flex: 0 0 auto; color: #64748b; }

.mm-help-spin {
  flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid #334155; border-top-color: #4da3ff; animation: mm-help-rot 0.8s linear infinite;
}
@keyframes mm-help-rot { to { transform: rotate(360deg); } }

/* Full list */
.mm-help-sheet {
  position: fixed; inset: 0; z-index: 9000; display: flex; flex-direction: column;
  background: #0a1120; color: #f1f5f9;
  padding-top: env(safe-area-inset-top, 0px);
  animation: mm-help-in 0.22s ease-out;
}
@keyframes mm-help-in { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }
.mm-help-sheet.is-closing { animation: mm-help-out 0.16s ease-in forwards; }
@keyframes mm-help-out { to { transform: translateY(16px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .mm-help-sheet, .mm-help-sheet.is-closing { animation: none; }
  .mm-help-spin { animation-duration: 2s; }
}

.mm-help-bar { display: flex; align-items: center; gap: 4px; padding: 8px 8px 4px; }
.mm-help-back {
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  background: none; border: 0; color: #f1f5f9; cursor: pointer; border-radius: 12px;
}
.mm-help-back:active { background: #16213a; }
.mm-help-bar-title { font-size: 1.15rem; font-weight: 700; }

.mm-help-scroll {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 6px 16px calc(28px + env(safe-area-inset-bottom, 0px));
}
.mm-help-intro { margin: 0 2px 18px; color: #94a3b8; font-size: 0.92rem; line-height: 1.45; }
.mm-help-group { margin: 0 0 22px; }
.mm-help-group-title {
  margin: 0 2px 10px; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.07em;
  text-transform: uppercase; color: var(--mm-help-c, #94a3b8);
}
.mm-help-group-list { background: #111a2e; border: 1px solid #1f2a44; border-radius: 16px; overflow: hidden; }

.mm-help-toast {
  position: fixed; left: 16px; right: 16px; bottom: calc(84px + env(safe-area-inset-bottom, 0px)); z-index: 9100;
  padding: 13px 16px; border-radius: 14px; background: #1e293b; border: 1px solid #334155;
  color: #f1f5f9; font-size: 0.92rem; text-align: center; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
}
`;
  document.head.appendChild(style);

  /* ---------- helpers ---------- */
  function lang() {
    try { return getSavedLanguage(); } catch (e) { return 'en'; }
  }

  // App translation when it exists, English otherwise.
  function t(key, fallback) {
    try {
      var v = miimiidTranslate(key, lang());
      if (typeof v === 'string' && v && v !== key) return v;
    } catch (e) { /* ignore */ }
    return fallback;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // "Don't Go as Planned?" and "dont go as planned" compare equal.
  function norm(s) {
    return String(s == null ? '' : s)
      .toLowerCase()
      .replace(/['\u2019\u2018]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  function byId(id) {
    for (var i = 0; i < SITUATIONS.length; i++) if (SITUATIONS[i].id === id) return SITUATIONS[i];
    return null;
  }

  function groupColor(id) {
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i].color;
    return '#94a3b8';
  }

  function minText(min) {
    return min + ' ' + t('helpNowMinLesson', 'min lesson');
  }

  function rowHtml(s) {
    return (
      '<button type="button" class="mm-help-row" data-help-id="' + esc(s.id) + '" style="--mm-help-c:' + groupColor(s.group) + '">' +
        '<span class="mm-help-ico">' + ICONS[s.icon] + '</span>' +
        '<span class="mm-help-text">' +
          '<span class="mm-help-label">' + esc(t('helpSit_' + s.id, s.label)) + '</span>' +
          '<span class="mm-help-sub">' + esc(minText(s.min)) + '</span>' +
        '</span>' +
        CHEVRON +
      '</button>'
    );
  }

  var toastTimer = null;
  function toast(message) {
    var old = document.querySelector('.mm-help-toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'mm-help-toast';
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, 3500);
  }

  /* ---------- find the course and the lesson ---------- */
  var courseIdPromise = null;

  function findCourseId() {
    if (courseIdPromise) return courseIdPromise;
    courseIdPromise = fetch('/api/learn/courses?language=' + encodeURIComponent(lang()))
      .then(function (res) { return res.json(); })
      .then(function (result) {
        var list = result && Array.isArray(result.data) ? result.data : [];
        for (var i = 0; i < list.length; i++) {
          var c = list[i];
          if (norm(c.title) === norm(COURSE) || String(c.slug || '') === 'money-basics') return String(c._id);
        }
        courseIdPromise = null;
        return null;
      })
      .catch(function () { courseIdPromise = null; return null; });
    return courseIdPromise;
  }

  function findLesson(situation) {
    var data;
    try { data = typeof courseDataCache !== 'undefined' ? courseDataCache : null; } catch (e) { data = null; }
    if (!data || !Array.isArray(data.modules)) return null;

    var bySlug = null;
    var byTitle = null;
    var key = norm(situation.key);

    data.modules.forEach(function (m) {
      (Array.isArray(m.lessons) ? m.lessons : []).forEach(function (l) {
        if (!bySlug && situation.slug && String(l.slug || '') === situation.slug) bySlug = l;
        if (!byTitle && key && norm(l.title).indexOf(key) === 0) byTitle = l;
      });
    });

    return bySlug || byTitle;
  }

  /* ---------- open the lesson (same steps as the Continue learning card) ---------- */
  var busy = false;

  async function go(situation, row) {
    if (busy) return;
    busy = true;

    var chev = row && row.querySelector('.mm-help-chev');
    var spin = null;
    if (row) {
      row.disabled = true;
      if (chev) {
        spin = document.createElement('span');
        spin.className = 'mm-help-spin';
        chev.replaceWith(spin);
      }
    }

    try {
      var courseId = await findCourseId();
      if (!courseId) throw new Error('course not found');

      closeSheet(true);

      if (typeof miimiidNavigate === 'function') await miimiidNavigate('learn');
      if (typeof openCourse === 'function') await openCourse(courseId);

      var lesson = findLesson(situation);
      if (lesson && typeof openLesson === 'function') {
        openLesson(lesson._id);
      } else {
        toast(t('helpNowNotFound', 'We could not open that lesson. Find it in the list.'));
      }
    } catch (e) {
      console.error('Help now error:', e);
      toast(t('helpNowFailed', 'Could not open the lesson. Check your connection and try again.'));
    } finally {
      busy = false;
      if (row && row.isConnected) {
        row.disabled = false;
        if (spin && spin.isConnected && chev) spin.replaceWith(chev);
      }
    }
  }

  function onRowClick(e) {
    var row = e.target.closest ? e.target.closest('.mm-help-row') : null;
    if (!row) return;
    var s = byId(row.getAttribute('data-help-id'));
    if (s) go(s, row);
  }

  /* ---------- the full list ---------- */
  var sheet = null;
  var lastFocus = null;

  function openSheet() {
    if (sheet) return;
    lastFocus = document.activeElement;

    var groupsHtml = GROUPS.map(function (g) {
      var rows = SITUATIONS.filter(function (s) { return s.group === g.id; }).map(rowHtml).join('');
      return (
        '<section class="mm-help-group" style="--mm-help-c:' + g.color + '">' +
          '<h3 class="mm-help-group-title">' + esc(t('helpGroup_' + g.id, g.label)) + '</h3>' +
          '<div class="mm-help-group-list">' + rows + '</div>' +
        '</section>'
      );
    }).join('');

    sheet = document.createElement('div');
    sheet.className = 'mm-help-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', t('helpNowTitle', 'Help with a real situation'));
    sheet.innerHTML =
      '<div class="mm-help-bar">' +
        '<button type="button" class="mm-help-back" aria-label="' + esc(t('back', 'Back')) + '">' + BACK + '</button>' +
        '<span class="mm-help-bar-title">' + esc(t('helpNowTitle', 'Help with a real situation')) + '</span>' +
      '</div>' +
      '<div class="mm-help-scroll">' +
        '<p class="mm-help-intro">' + esc(t('helpNowIntro', "Pick what's happening. We'll open the lesson that helps.")) + '</p>' +
        groupsHtml +
      '</div>';

    sheet.querySelector('.mm-help-back').addEventListener('click', function () { closeSheet(); });
    sheet.addEventListener('click', onRowClick);

    document.body.appendChild(sheet);
    document.documentElement.style.overflow = 'hidden';
    sheet.querySelector('.mm-help-back').focus();
  }

  function closeSheet(immediate) {
    if (!sheet) return;
    var el = sheet;
    sheet = null;
    document.documentElement.style.overflow = '';

    function remove() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }

    if (immediate) {
      remove();
    } else {
      el.classList.add('is-closing');
      setTimeout(remove, 170);
      try { if (lastFocus && lastFocus.focus) lastFocus.focus(); } catch (e) { /* ignore */ }
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sheet) closeSheet();
  });

  /* ---------- the section on Home ---------- */
  function render() {
    var content = document.querySelector('#miimiid-dashboard .miimiid-dashboard-content');
    if (!content || content.querySelector('.mm-help')) return;

    var rows = HOME_IDS.map(byId).filter(Boolean).map(rowHtml).join('');

    var section = document.createElement('section');
    section.className = 'mm-help';
    section.innerHTML =
      '<div class="mm-help-head">' +
        '<span class="mm-help-title">' + esc(t('helpNowTitle', 'Help with a real situation')) + '</span>' +
        '<button type="button" class="mm-help-all">' + esc(t('helpNowSeeAll', 'See all')) + '</button>' +
      '</div>' +
      '<div class="mm-help-list">' + rows + '</div>';

    section.querySelector('.mm-help-all').addEventListener('click', openSheet);
    section.querySelector('.mm-help-list').addEventListener('click', onRowClick);

    // Sit between "Money tools" and the stat cards.
    var stats = content.querySelector('.miimiid-dashboard-stat-grid');
    if (stats && stats.parentNode === content) content.insertBefore(section, stats);
    else content.appendChild(section);
  }

  var dash = document.getElementById('miimiid-dashboard');
  if (dash) {
    new MutationObserver(render).observe(dash, { childList: true });
    render();
  }

  // Small surface for tests and for opening the full list from elsewhere.
  window.MiimiidHelpNow = { open: openSheet, situations: SITUATIONS, _find: findLesson };
})();
