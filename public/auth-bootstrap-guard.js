(function () {
  'use strict';

  const BOOT_TIMEOUT_MS = 18000;
  let initialized = false;
  let recoveryTimer = null;
  let bootstrapHandle = null;
  let unsubscribe = null;
  let restoring = false;

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

  function showBootstrap() {
    const { auth, loading, card, shell, header } = elements();
    if (!auth) return;

    auth.classList.remove('hidden');
    if (loading && isHidden(card)) loading.classList.remove('hidden');
    if (shell) shell.classList.add('hidden');
    if (header) header.classList.add('hidden');
  }

  function showAuthenticated() {
    const { auth, loading, shell, header } = elements();
    if (auth) auth.classList.add('hidden');
    if (loading) loading.classList.add('hidden');
    if (shell) shell.classList.remove('hidden');
    if (header) header.classList.remove('hidden');
  }

  function showUnauthenticated() {
    const { auth, loading, shell, header } = elements();
    if (auth) auth.classList.remove('hidden');
    if (loading) loading.classList.add('hidden');
    if (shell) shell.classList.add('hidden');
    if (header) header.classList.add('hidden');
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

  function renderFromState(snapshot) {
    if (!snapshot) return;

    switch (snapshot.sessionStatus) {
      case 'restoring':
      case 'unknown':
        showBootstrap();
        break;
      case 'authenticated':
        stopBootstrapLoading();
        showAuthenticated();
        break;
      case 'unauthenticated':
      case 'expired':
        stopBootstrapLoading();
        showUnauthenticated();
        break;
      case 'error':
        stopBootstrapLoading();
        showUnauthenticated();
        break;
      default:
        showBootstrap();
    }
  }

  function recoverIfBlank() {
    const { auth, shell } = elements();
    if (!auth || !shell) return;

    const authVisible = !isHidden(auth);
    const shellVisible = !isHidden(shell);

    if (!authVisible && !shellVisible) showBootstrap();
  }

  async function restoreSession() {
    const engine = window.MIIMIID_AUTH_ENGINE;
    if (!engine || restoring) return;

    restoring = true;
    try {
      await engine.loadCurrentUser();
    } catch (error) {
      console.error('Miimiid session bootstrap failed:', error);
    } finally {
      restoring = false;
      stopBootstrapLoading();
    }
  }

  function loadNavigationIcons() {
    if (document.querySelector('script[data-miimiid-navigation-icons]')) return;
    const script = document.createElement('script');
    script.src = '/miimiid-navigation-icons.js';
    script.defer = true;
    script.dataset.miimiidNavigationIcons = 'true';
    document.head.appendChild(script);
  }

  function boot() {
    if (initialized) return;
    initialized = true;

    loadNavigationIcons();
    startBootstrapLoading();
    showBootstrap();

    const engine = window.MIIMIID_AUTH_ENGINE;
    if (engine?.subscribe) {
      unsubscribe = engine.subscribe(renderFromState);
      restoreSession();
    } else {
      recoverIfBlank();
      console.error('Miimiid auth engine is unavailable during bootstrap.');
    }

    recoveryTimer = window.setTimeout(() => {
      recoveryTimer = null;
      recoverIfBlank();
      stopBootstrapLoading();
    }, BOOT_TIMEOUT_MS);

    window.addEventListener('pageshow', recoverIfBlank, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
