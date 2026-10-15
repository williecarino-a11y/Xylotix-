(function () {
  'use strict';

  /* =====================================================
     MIIMIID PREMIUM EXTRAS
     1. "You're offline" bar (and a short "Back online")
     2. Tiny haptic tap on nav tabs and the AI Tutor send button
     ===================================================== */

  /* ---------- 1. Offline bar ---------- */
  var bar = null;
  var hideTimer = null;

  function removeBar() {
    if (!bar) return;
    var el = bar;
    bar = null;
    el.classList.remove('mm-show');
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }

  function showOffline() {
    clearTimeout(hideTimer);
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'mm-offline-bar';
      bar.setAttribute('role', 'status');
      document.body.appendChild(bar);
      requestAnimationFrame(function () {
        if (bar) bar.classList.add('mm-show');
      });
    }
    bar.classList.remove('mm-ok');
    bar.textContent = "You're offline. Some things may not work until you reconnect.";
  }

  function showBackOnline() {
    if (!bar) return;
    bar.classList.add('mm-ok');
    bar.textContent = 'Back online';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(removeBar, 1600);
  }

  window.addEventListener('offline', showOffline);
  window.addEventListener('online', showBackOnline);
  if (navigator.onLine === false) showOffline();

  /* ---------- 2. Haptics ---------- */
  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (target.closest('#miimiid-bottom-nav button')) buzz(8);
    else if (target.closest('#ai-tutor-send-btn')) buzz(12);
  }, true);
})();
