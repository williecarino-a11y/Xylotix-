/*
 * MIIMIID MART LESSON SCENARIOS
 *
 * After a lesson, "Try it in the Mart" opens a short Mart trip built around one
 * decision. The server picks the day card and the event and judges the result.
 * This file only: finds the scenario for a lesson, starts the trip with it,
 * and shows the verdict (with a retry) when the trip is checked out.
 *
 * Loaded last in index.html. It does not change fun-center-world.js.
 */
(function () {
  'use strict';
  if (window.MiimiidMartScenario) return;

  var DONE_KEY = 'miimiid-mart-scenarios-done';
  var scenarios = [];
  var lastLoad = 0;
  var pendingId = null;
  var pendingTimer = null;
  var realFetch = window.fetch.bind(window);

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function t(key, fallback) {
    try {
      var v = window.miimiidTranslate(key, getSavedLanguage());
      if (typeof v === 'string' && v && v !== key) return v;
    } catch (e) { /* ignore */ }
    return fallback;
  }

  function doneList() {
    try {
      var raw = window.localStorage.getItem(DONE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function markDone(id) {
    try {
      var list = doneList();
      if (list.indexOf(id) === -1) list.push(id);
      window.localStorage.setItem(DONE_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  /* ---------- scenario list (from the server) ---------- */

  function loadScenarios() {
    lastLoad = Date.now();
    return realFetch('/api/fun-center/scenarios', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        if (body && body.status === 'success' && Array.isArray(body.data)) scenarios = body.data;
      })
      .catch(function () { /* offline: try again later */ });
  }

  function forLesson(title) {
    if (!scenarios.length && Date.now() - lastLoad > 30000) loadScenarios();
    var name = String(title || '').toLowerCase();
    if (!name) return null;
    for (var i = 0; i < scenarios.length; i++) {
      var words = Array.isArray(scenarios[i].lessonKeywords) ? scenarios[i].lessonKeywords : [];
      for (var j = 0; j < words.length; j++) {
        if (words[j] && name.indexOf(String(words[j]).toLowerCase()) !== -1) return scenarios[i];
      }
    }
    return null;
  }

  function isDone(id) { return doneList().indexOf(id) !== -1; }

  /* ---------- start a scenario trip ---------- */

  function clearPending() {
    pendingId = null;
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
  }

  function start(id) {
    clearPending();
    pendingId = id;
    // If the trip never starts, do not leave the scenario waiting for a later normal trip.
    pendingTimer = setTimeout(clearPending, 20000);

    function go() {
      if (typeof window.startMiimiidShop === 'function') window.startMiimiidShop();
      else clearPending();
    }
    try {
      if (typeof window.miimiidNavigate === 'function') {
        Promise.resolve(window.miimiidNavigate('funCenter')).then(go, go);
      } else {
        go();
      }
    } catch (e) { go(); }
  }

  /* ---------- fetch hook: add the scenario to the trip, read the verdict ---------- */

  window.fetch = function (input, init) {
    var path = '';
    var method = 'GET';
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      path = url.split('?')[0].replace(/^https?:\/\/[^/]+/, '');
      method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    } catch (e) { /* ignore */ }

    var isStart = method === 'POST' && path === '/api/fun-center/shop/session';
    var isCheckout = method === 'POST' && /^\/api\/fun-center\/shop\/session\/[^/]+\/checkout$/.test(path);

    if (isStart && pendingId) {
      var id = pendingId;
      clearPending();
      try {
        var body = init && typeof init.body === 'string' && init.body ? JSON.parse(init.body) : {};
        body.scenarioId = id;
        init = Object.assign({}, init || {}, { body: JSON.stringify(body) });
      } catch (e) { /* ignore */ }
    }

    var request = realFetch(input, init);

    if (isCheckout) {
      request
        .then(function (res) { return res.clone().json(); })
        .then(function (body) {
          var verdict = body && body.data && body.data.scenario;
          if (verdict && typeof verdict.passed === 'boolean') showVerdict(verdict);
        })
        .catch(function () { /* ignore */ });
    }
    return request;
  };

  /* ---------- verdict sheet ---------- */

  function injectStyles() {
    if (document.getElementById('mart-scenario-styles')) return;
    var style = document.createElement('style');
    style.id = 'mart-scenario-styles';
    style.textContent =
      '.mms-overlay{position:fixed;left:0;right:0;bottom:0;z-index:10000;padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px));animation:mmsUp .25s ease}' +
      '@keyframes mmsUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}' +
      '.mms-sheet{max-width:520px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:18px}' +
      '.mms-tag{font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}' +
      '.mms-sheet h3{margin:0 0 6px;font-size:1.15rem;color:#f8fafc}' +
      '.mms-sheet.is-pass h3{color:#4ade80}.mms-sheet.is-fail h3{color:#fbbf24}' +
      '.mms-sheet p{margin:0 0 14px;color:#cbd5e1;font-size:.95rem;line-height:1.45}' +
      '.mms-row{display:flex;gap:10px}' +
      '.mms-btn{flex:1;border-radius:12px;padding:13px 14px;font:inherit;font-weight:600;cursor:pointer;border:1px solid #334155;background:transparent;color:#f8fafc}' +
      '.mms-btn.mms-primary{background:#38bdf8;border-color:#38bdf8;color:#0b1220}';
    document.head.appendChild(style);
  }

  function removeVerdict() {
    var old = document.querySelector('[data-mart-scenario-verdict]');
    if (old) old.remove();
  }

  function goLearn() {
    removeVerdict();
    try { if (typeof window.miimiidNavigate === 'function') window.miimiidNavigate('learn'); } catch (e) { /* ignore */ }
  }

  function showVerdict(v) {
    injectStyles();
    removeVerdict();
    var passed = !!v.passed;
    if (passed) markDone(v.id);

    var el = document.createElement('div');
    el.className = 'mms-overlay';
    el.setAttribute('data-mart-scenario-verdict', '');
    el.innerHTML =
      '<div class="mms-sheet ' + (passed ? 'is-pass' : 'is-fail') + '">' +
      '<div class="mms-tag">' + esc(v.title) + '</div>' +
      '<h3>' + esc(passed ? t('quizPassed', 'Nice work') : t('quizNotPassed', 'Not quite yet')) + '</h3>' +
      '<p>' + esc(v.reason) + '</p>' +
      '<div class="mms-row">' +
      (passed
        ? '<button type="button" class="mms-btn mms-primary" data-mms-learn>' + esc(t('continue', 'Continue')) + '</button>'
        : '<button type="button" class="mms-btn" data-mms-learn>' + esc(t('learn', 'Learn')) + '</button>' +
          '<button type="button" class="mms-btn mms-primary" data-mms-retry>' + esc(t('tryAgain', 'Try again')) + '</button>') +
      '</div></div>';
    document.body.appendChild(el);

    var learnBtn = el.querySelector('[data-mms-learn]');
    if (learnBtn) learnBtn.addEventListener('click', goLearn);
    var retryBtn = el.querySelector('[data-mms-retry]');
    if (retryBtn) retryBtn.addEventListener('click', function () { removeVerdict(); start(v.id); });
  }

  window.MiimiidMartScenario = { forLesson: forLesson, start: start, isDone: isDone };

  loadScenarios();
})();
