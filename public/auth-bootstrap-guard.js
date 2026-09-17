/**
 * Miimiid authentication bootstrap coordinator.
 *
 * Responsibilities:
 * - Observe the auth-engine session lifecycle.
 * - Keep the authentication loading/login state visible while session
 *   restoration is in progress.
 * - Keep the legacy application initializer and auth engine as the single
 *   owners of dashboard initialization and authenticated shell exposure.
 *
 * Authentication state and the actual session restore request remain owned by
 * MIIMIID_AUTH_ENGINE. The legacy application initializer already consumes
 * that state and initializes the dashboard, so this guard must not start a
 * second restore or a competing dashboard initialization.
 */
(function () {
  'use strict';

  const BOOT_TIMEOUT_MS = 18000;
  const SELECTORS = Object.freeze({
    auth: '#miimiid-auth-view',
    loading: '#miimiid-auth-loading',
    card: '#miimiid-auth-card',
    shell: '#miimiid-app-shell',
    header: '.miimiid-header'
  });

  const refs = {};
  let booted = false;
  let bootstrapLoadingHandle = null;
  let timeoutId = null;
  let unsubscribe = null;

  function cacheElements() {
    refs.auth = document.querySelector(SELECTORS.auth);
    refs.loading = document.querySelector(SELECTORS.loading);
    refs.card = document.querySelector(SELECTORS.card);
    refs.shell = document.querySelector(SELECTORS.shell);
    refs.header = document.querySelector(SELECTORS.header);
    return refs;
  }

  function setHidden(element, hidden) {
    if (element) element.classList.toggle('hidden', hidden);
  }

  function setAuthView({ loading, card }) {
    setHidden(refs.auth, false);
    setHidden(refs.loading, !loading);
    setHidden(refs.card, !card);
    setHidden(refs.shell, true);
    setHidden(refs.header, true);
  }

  function showBootstrapView() {
    setAuthView({ loading: true, card: false });
  }

  function showLoginView() {
    setAuthView({ loading: false, card: true });
  }

  function startBootstrapLoader() {
    if (bootstrapLoadingHandle || !window.ContinueLoading?.start) return;

    bootstrapLoadingHandle = window.ContinueLoading.start({
      id: 'auth-bootstrap',
      context: 'auth',
      message: 'Restoring your session…',
      delay: 0
    });
  }

  function stopBootstrapLoader() {
    if (!bootstrapLoadingHandle || !window.ContinueLoading?.stop) return;

    window.ContinueLoading.stop(bootstrapLoadingHandle);
    bootstrapLoadingHandle = null;
  }

  function clearBootstrapTimeout() {
    if (timeoutId === null) return;
    window.clearTimeout(timeoutId);
    timeoutId = null;
  }

  function armBootstrapTimeout() {
    clearBootstrapTimeout();

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      const engine = window.MIIMIID_AUTH_ENGINE;
      const sessionStatus = engine?.getState?.().sessionStatus;

      if (sessionStatus === 'restoring' || sessionStatus === 'unknown') {
        console.error('Miimiid authentication bootstrap timed out.');
        stopBootstrapLoader();
        showLoginView();
      }
    }, BOOT_TIMEOUT_MS);
  }

  function reconcileSession(snapshot) {
    if (!snapshot) return;

    switch (snapshot.sessionStatus) {
      case 'unknown':
      case 'restoring':
        showBootstrapView();
        return;

      case 'authenticated':
        // initializeMiimiidApplication() already owns the authenticated
        // dashboard initialization and final shell visibility transition.
        clearBootstrapTimeout();
        stopBootstrapLoader();
        return;

      case 'unauthenticated':
      case 'expired':
      case 'error':
        clearBootstrapTimeout();
        stopBootstrapLoader();
        showLoginView();
        return;

      default:
        console.warn('Unknown Miimiid session state:', snapshot.sessionStatus);
        showBootstrapView();
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

  function handlePageShow() {
    const engine = window.MIIMIID_AUTH_ENGINE;
    const snapshot = engine?.getState?.();
    if (!snapshot) return;

    if (snapshot.sessionStatus === 'authenticated') {
      clearBootstrapTimeout();
      stopBootstrapLoader();
    }
  }

  function boot() {
    if (booted) return;
    booted = true;

    cacheElements();
    loadNavigationIcons();
    showBootstrapView();
    startBootstrapLoader();
    armBootstrapTimeout();

    const engine = window.MIIMIID_AUTH_ENGINE;
    if (!engine?.subscribe) {
      console.error('Miimiid auth engine is unavailable during bootstrap.');
      stopBootstrapLoader();
      clearBootstrapTimeout();
      showLoginView();
      return;
    }

    unsubscribe = engine.subscribe((snapshot) => {
      reconcileSession(snapshot);
    });

    window.addEventListener('pageshow', handlePageShow, { passive: true });
  }

  window.addEventListener('beforeunload', () => {
    clearBootstrapTimeout();
    stopBootstrapLoader();
    unsubscribe?.();
    window.removeEventListener('pageshow', handlePageShow);
  }, { once: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
