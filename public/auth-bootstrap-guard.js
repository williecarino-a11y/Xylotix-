(function () {
  'use strict';

  const BOOT_TIMEOUT_MS = 18000;
  let initialized = false;
  let recoveryTimer = null;
  let bootstrapHandle = null;
  let bootstrapFinished = false;

  function elements() {
    return {
      auth: document.getElementById('miimiid-auth-view'),
      loading: document.getElementById('miimiid-auth-loading'),
      card: document.getElementById('miimiid-auth-card'),
      shell: document.getElementById('miimiid-app-shell'),
      header: document.querySelector('.miimiid-header')
    };
  }

  function isHidden(element) {
    return !element || element.classList.contains('hidden');
  }

  function startBootstrapLoading() {
    if (bootstrapHandle || !window.ContinueLoading?.start) return;

    bootstrapHandle = window.ContinueLoading.start({
      id: 'auth-bootstrap',
      context: 'auth',
      message: 'Starting Miimiid…',
      delay: 0
    });
  }

  function stopBootstrapLoading() {
    if (!bootstrapHandle || !window.ContinueLoading?.stop) return;

    window.ContinueLoading.stop(bootstrapHandle);
    bootstrapHandle = null;
  }

  function markBootstrapReady() {
    if (bootstrapFinished) return;
    bootstrapFinished = true;
    stopBootstrapLoading();
  }

  function showBootstrap() {
    const { auth, loading, card, shell, header } = elements();
    if (!auth) return;

    auth.classList.remove('hidden');
    if (loading && isHidden(card)) loading.classList.remove('hidden');

    if (shell) shell.classList.add('hidden');
    if (header) header.classList.add('hidden');
  }

  function recoverIfBlank() {
    const { auth, loading, card, shell } = elements();
    if (!auth || !shell) return;

    const authVisible = !isHidden(auth);
    const shellVisible = !isHidden(shell);

    if (!authVisible && !shellVisible) {
      showBootstrap();
      return;
    }

    if (shellVisible || (authVisible && !isHidden(card))) {
      markBootstrapReady();
      return;
    }

    if (authVisible && isHidden(card) && loading && isHidden(loading)) {
      loading.classList.remove('hidden');
    }
  }

  function boot() {
    if (initialized) return;
    initialized = true;

    startBootstrapLoading();
    recoverIfBlank();

    const { auth, shell } = elements();
    const observer = new MutationObserver(recoverIfBlank);

    [auth, shell].forEach(element => {
      if (element) {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    });

    recoveryTimer = window.setTimeout(() => {
      recoveryTimer = null;
      recoverIfBlank();
      markBootstrapReady();
    }, BOOT_TIMEOUT_MS);

    window.addEventListener('pageshow', recoverIfBlank, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
