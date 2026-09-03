(function () {
  'use strict';

  function syncShell() {
    const authView = document.getElementById('miimiid-auth-view');
    const appShell = document.getElementById('miimiid-app-shell');
    const header = document.querySelector('.miimiid-header');

    if (!appShell || !header) return;

    const shellVisible = !appShell.classList.contains('hidden');
    const authVisible = authView && !authView.classList.contains('hidden');

    if (shellVisible && !authVisible) {
      header.classList.remove('hidden');
    }
  }

  function boot() {
    syncShell();

    const observer = new MutationObserver(syncShell);
    const appShell = document.getElementById('miimiid-app-shell');
    const authView = document.getElementById('miimiid-auth-view');

    if (appShell) observer.observe(appShell, { attributes: true, attributeFilter: ['class'] });
    if (authView) observer.observe(authView, { attributes: true, attributeFilter: ['class'] });

    window.setInterval(syncShell, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
