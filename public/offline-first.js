(function () {
  'use strict';

  /* ---------- the splash while the app checks the session ---------- */
  var base = document.createElement('style');
  base.textContent = `
#miimiid-auth-loading:not(.hidden) { display: flex; align-items: center; justify-content: center; min-height: 60vh; }
.mm-splash-word { color: #38bdf8; font-size: 2.4rem; font-weight: 800; letter-spacing: -0.015em; }
.mm-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;
  (document.head || document.documentElement).appendChild(base);

  /* ---------- offline start: decide before anything else runs ---------- */
  var signedIn = false;
  try { signedIn = localStorage.getItem('mmSignedInHint') === '1'; } catch (e) {}

  /* ---------- keep the splash a plain wordmark, whatever else writes into it ---------- */
  function enforceSplash() {
    var el = document.getElementById('miimiid-auth-loading');
    if (!el) return;

    function apply() {
      if (el.querySelector('.mm-splash-word')) return;
      el.innerHTML =
        '<span class="mm-splash-word" aria-hidden="true">Miimiid</span>' +
        '<span class="mm-sr-only">Checking your Miimiid session</span>';
    }

    apply();
    new MutationObserver(apply).observe(el, { childList: true, characterData: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enforceSplash);
  else enforceSplash();

  if (!(navigator.onLine === false && signedIn)) return;

  // The startup code reads this and skips the session check and loaders
  window.__mmOfflineStart = true;

  var style = document.createElement('style');
  style.textContent = `
.mm-noconn {
  position: fixed; inset: 0; z-index: 99990; display: flex; align-items: center; justify-content: center;
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
  document.head.appendChild(style);

  function render() {
    if (document.querySelector('.mm-noconn')) return;

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
  }

  // The moment the phone is back online, reload and carry on
  window.addEventListener('online', function () { location.reload(); });

  if (document.body) render();
  else document.addEventListener('DOMContentLoaded', render);
})();
