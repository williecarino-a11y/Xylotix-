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
  var TIMEOUT_ME_MS = 12000;

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
        try {
          if (path === '/api/auth/me') {
            meFailed = false;
            if (response.status === 401) setHint(false);
            else if (response.ok) setHint(true);
          } else if (path === '/api/auth/login' && response.ok) {
            setHint(true);
          } else if (path === '/api/auth/logout' && response.ok) {
            setHint(false);
          }
        } catch (e) {}
        return response;
      },
      function (error) {
        clearTimeout(timer);
        if (path === '/api/auth/me') meFailed = true;

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
    return; // the app already shows its own offline bar
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

  /* ---------- the "No connection" screen shown at startup ---------- */
  var retryStyle = null;

  function showRetry() {
    if (document.querySelector('.mm-noconn')) return;

    if (!retryStyle) {
      retryStyle = document.createElement('style');
      retryStyle.textContent = `
.mm-noconn {
  position: fixed; inset: 0; z-index: 3750; display: flex; align-items: center; justify-content: center;
  padding: 24px; box-sizing: border-box; background: #0b1220;
}
.mm-noconn-inner { width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.mm-noconn-ico { width: 68px; height: 68px; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: rgba(77, 163, 255, 0.12); color: #4da3ff; margin-bottom: 6px; }
.mm-noconn h1 { margin: 0; color: #f8fafc; font-size: 1.6rem; font-weight: 800; }
.mm-noconn p { margin: 0; color: #94a3b8; font-size: 1rem; line-height: 1.6; }
.mm-noconn-msg { min-height: 1.3em; color: #fbbf24; font-size: 0.9rem; }
.mm-noconn-btn {
  width: 100%; min-height: 54px; border: 0; border-radius: 14px; background: #1f6feb; color: #fff;
  font-family: inherit; font-size: 1rem; font-weight: 700; cursor: pointer; transition: transform 0.15s ease;
}
.mm-noconn-btn:active { transform: scale(0.98); }
`;
      document.head.appendChild(retryStyle);
    }

    var el = document.createElement('section');
    el.className = 'mm-noconn';
    el.setAttribute('role', 'alert');
    el.innerHTML =
      '<div class="mm-noconn-inner">' +
        '<span class="mm-noconn-ico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>' +
          '<path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>' +
        '</svg></span>' +
        '<h1>No connection</h1>' +
        '<p>We couldn\u2019t reach Miimiid. You are still signed in. Check your connection and try again.</p>' +
        '<div class="mm-noconn-msg"></div>' +
        '<button type="button" class="mm-noconn-btn">Try again</button>' +
      '</div>';
    document.body.appendChild(el);

    var msg = el.querySelector('.mm-noconn-msg');
    el.querySelector('.mm-noconn-btn').addEventListener('click', function () {
      if (navigator.onLine === false) {
        msg.textContent = 'Still offline. Turn on mobile data or Wi-Fi, then try again.';
        return;
      }
      location.reload();
    });

    // The moment the phone is back online, reload and carry on
    window.addEventListener('online', function () { location.reload(); });
  }

  window.MiimiidConnection = { showRetry: showRetry };

  /* ---------- safety net: never show login to a signed-in phone that is just offline ---------- */
  var HINT = 'mmSignedInHint';
  var meFailed = false;

  function setHint(on) {
    try {
      if (on) localStorage.setItem(HINT, '1');
      else localStorage.removeItem(HINT);
    } catch (e) {}
  }

  function hinted() {
    try { return localStorage.getItem(HINT) === '1'; } catch (e) { return false; }
  }

  function authFormShowing() {
    var view = document.getElementById('miimiid-auth-view');
    var card = document.getElementById('miimiid-auth-card');
    return Boolean(
      view && !view.classList.contains('hidden') &&
      card && !card.classList.contains('hidden')
    );
  }

  function checkSignedInOffline() {
    if (!authFormShowing() || !hinted()) return;
    if (navigator.onLine === false || meFailed) showRetry();
  }

  var authView = document.getElementById('miimiid-auth-view');
  if (authView) {
    new MutationObserver(checkSignedInOffline).observe(authView, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });
  }
  window.addEventListener('offline', checkSignedInOffline);
  setTimeout(checkSignedInOffline, 600);

  // A little breathing room under the red message on the sign-in form
  var gap = document.createElement('style');
  gap.textContent = '#miimiid-auth-status:not(:empty) { margin-bottom: 16px; }';
  document.head.appendChild(gap);
})();
