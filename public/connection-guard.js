(function () {
  'use strict';
  if (window.__mmConnectionInstalled) return;
  window.__mmConnectionInstalled = true;

  /* ---------- wording (kept in one place so it can be translated later) ---------- */
  var T = {
    offline: "You're offline. Connect to the internet and try again.",
    unreachable: "We couldn't reach Miimiid. Check your connection and try again.",
    slow: 'This is taking longer than usual. The server may be waking up. Please try again in a moment.',
    bannerOffline: "You're offline. Some features need a connection.",
    bannerBack: 'Back online'
  };

  var TIMEOUT_MS = 45000;
  var TIMEOUT_TUTOR_MS = 90000;

  /* ---------- turn raw network failures into clear messages ---------- */
  var baseFetch = window.fetch.bind(window);

  function friendly(message, kind) {
    var error = new Error(message);
    error.name = 'NetworkError';
    error.isNetworkError = true;
    error.kind = kind;
    return error;
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var path = url.replace(location.origin, '');

    // Only our own API calls (telemetry stays untouched)
    if (path.indexOf('/api/') !== 0 || path.indexOf('/api/learn/telemetry') === 0) {
      return baseFetch(input, init);
    }

    var options = init || {};
    var timer = null;
    var timedOut = false;

    if (!options.signal && typeof AbortController === 'function') {
      var controller = new AbortController();
      var limit = /tutor/i.test(path) ? TIMEOUT_TUTOR_MS : TIMEOUT_MS;
      timer = setTimeout(function () { timedOut = true; controller.abort(); }, limit);
      options = Object.assign({}, options, { signal: controller.signal });
    }

    return baseFetch(input, options).then(
      function (response) {
        clearTimeout(timer);
        return response;
      },
      function (error) {
        clearTimeout(timer);

        if (timedOut && error && error.name === 'AbortError') {
          throw friendly(T.slow, 'slow');
        }

        var text = error && error.message ? String(error.message) : '';
        if (error instanceof TypeError || /failed to fetch|load failed|network/i.test(text)) {
          if (navigator.onLine === false) throw friendly(T.offline, 'offline');
          throw friendly(T.unreachable, 'unreachable');
        }

        throw error;
      }
    );
  };

  /* ---------- the slim bar at the top ---------- */
  var style = document.createElement('style');
  style.textContent = `
.mm-net {
  position: fixed; top: 0; left: 0; right: 0; z-index: 3900;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: calc(env(safe-area-inset-top, 0px) + 9px) 16px 9px;
  background: #1e293b; border-bottom: 1px solid #334155; color: #f1f5f9;
  font-size: 0.88rem; font-weight: 600; text-align: center;
  transform: translateY(-100%); transition: transform 0.25s ease;
}
.mm-net.is-show { transform: translateY(0); }
.mm-net i { width: 8px; height: 8px; border-radius: 50%; background: #f87171; flex: 0 0 auto; }
.mm-net.is-back i { background: #4ade80; }
@media (prefers-reduced-motion: reduce) { .mm-net { transition: none; } }
`;
  document.head.appendChild(style);

  var bar = null;
  var hideTimer = null;

  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'mm-net';
    bar.setAttribute('role', 'status');
    document.body.appendChild(bar);
    return bar;
  }

  function show(text, back) {
    var el = ensureBar();
    clearTimeout(hideTimer);
    el.className = 'mm-net' + (back ? ' is-back' : '');
    el.innerHTML = '<i></i><span></span>';
    el.querySelector('span').textContent = text;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add('is-show'); });
    });
  }

  function hide() {
    if (!bar) return;
    bar.classList.remove('is-show');
  }

  window.addEventListener('offline', function () { show(T.bannerOffline, false); });

  window.addEventListener('online', function () {
    show(T.bannerBack, true);
    hideTimer = setTimeout(hide, 2200);
  });

  if (navigator.onLine === false) {
    if (document.body) show(T.bannerOffline, false);
    else document.addEventListener('DOMContentLoaded', function () { show(T.bannerOffline, false); });
  }
})();
