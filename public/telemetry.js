(function () {
  'use strict';
  if (window.__mmTelemetryInstalled) return;
  window.__mmTelemetryInstalled = true;

  var ERROR_URL = '/api/learn/telemetry/error';
  var EVENT_URL = '/api/learn/telemetry/event';
  var baseFetch = window.fetch.bind(window);

  var IGNORE = [
    /ResizeObserver loop/i,
    /^Script error\.?$/i,
    /Failed to fetch|Load failed|NetworkError|network error/i,
    /internet connection|reach Miimiid|taking longer than usual/i
  ];

  var seen = {};
  var budget = 8;

  function post(url, payload) {
    try {
      baseFetch(url, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    } catch (e) {}
  }

  function report(info) {
    var message = String(info.message || '').slice(0, 300);
    if (!message || budget <= 0) return;
    for (var i = 0; i < IGNORE.length; i++) if (IGNORE[i].test(message)) return;

    var key = message + '|' + (info.source || '');
    if (seen[key]) return;
    seen[key] = true;
    budget -= 1;

    post(ERROR_URL, {
      message: message,
      source: String(info.source || '').slice(0, 200),
      line: info.line || 0,
      stack: String(info.stack || '').slice(0, 1500),
      page: location.pathname
    });
  }

  window.addEventListener('error', function (event) {
    if (event.target && event.target !== window) return;
    report({
      message: event.message,
      source: event.filename,
      line: event.lineno,
      stack: event.error && event.error.stack
    });
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    report({
      message: reason && reason.message ? reason.message : String(reason),
      source: 'promise',
      stack: reason && reason.stack
    });
  });

  /* ---------- usage counts (anonymous, only while signed in) ---------- */
  var lastTracked = {};

  function userKnown() {
    var u = window.MIIMIID_CURRENT_USER || window.currentUser || {};
    return Boolean(u.id || u._id);
  }

  function track(name) {
    if (!userKnown()) return;
    var now = Date.now();
    if (lastTracked[name] && now - lastTracked[name] < 20000) return;
    lastTracked[name] = now;
    post(EVENT_URL, { name: name });
  }

  window.MiimiidTrack = track;

  /* ---------- watch API calls ---------- */
  function cleanPath(url) {
    return String(url || '').replace(location.origin, '').split('?')[0].replace(/[a-f0-9]{24}/gi, ':id');
  }

  window.fetch = function (input, init) {
    var promise = baseFetch.apply(this, arguments);
    try {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var path = cleanPath(url);
      if (path.indexOf('/api/') === 0 && path.indexOf('/api/learn/telemetry') !== 0) {
        var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
        promise.then(function (response) {
          if (!response) return;
          if (response.status >= 500) {
            report({ message: 'HTTP ' + response.status + ' ' + method + ' ' + path, source: 'api' });
          }
          if (response.ok && method === 'POST' && /^\/api\/learn\/lessons\/:id\/complete$/.test(path)) {
            track('lesson_completed');
          }
        }).catch(function () {});
      }
    } catch (e) {}
    return promise;
  };

  /* ---------- screens and lessons ---------- */
  var originalNavigate = window.miimiidNavigate;
  if (typeof originalNavigate === 'function') {
    window.miimiidNavigate = function (view) {
      try { if (typeof view === 'string') track('screen_' + view); } catch (e) {}
      return originalNavigate.apply(this, arguments);
    };
  }

  var originalOpenLesson = window.openLesson;
  if (typeof originalOpenLesson === 'function') {
    window.openLesson = function () {
      try { track('lesson_open'); } catch (e) {}
      return originalOpenLesson.apply(this, arguments);
    };
  }

  setTimeout(function () { track('app_open'); }, 4000);
})();
