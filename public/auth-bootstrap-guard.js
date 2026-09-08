/**
 * Miimiid authentication bootstrap coordinator.
 *
 * Responsibilities:
 * - Own the initial session-restore lifecycle.
 * - Keep auth UI and application shell mutually exclusive during bootstrap.
 * - Initialize the dashboard before exposing authenticated UI.
 * - Delegate authentication state to MIIMIID_AUTH_ENGINE.
 *
 * Authentication state itself remains owned by the auth engine.
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
  let sessionRestorePromise = null;
  let dashboardReadyPromise = null;
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

  function setAppView() {
    setHidden(refs.auth, true);
    setHidden(refs.loading, true);
    setHidden(refs.card, true);
    setHidden(refs.shell, false);
    setHidden(refs.header, false);
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

  async function initializeDashboardOnce() {
    if (dashboardReadyPromise) return dashboardReadyPromise;

    if (typeof window.initializeMiimiidDashboard !== 'function') {
      throw new Error('Miimiid dashboard initializer is unavailable.');
    }

    dashboardReadyPromise = Promise.resolve()
      .then(() => window.initializeMiimiidDashboard())
      .then((ready) => {
        if (ready !== true) {
          throw new Error('Miimiid dashboard initialization did not complete successfully.');
        }
        return true;
      })
      .catch((error) => {
        dashboardReadyPromise = null;
        throw error;
      });

    return dashboardReadyPromise;
  }

  async function revealAuthenticatedApp() {
    try {
      await initializeDashboardOnce();
      clearBootstrapTimeout();
      stopBootstrapLoader();
      setAppView();
      return true;
    } catch (error) {
      console.error('Miimiid authenticated shell initialization failed:', error);
      clearBootstrapTimeout();
      stopBootstrapLoader();
      showLoginView();
      return false;
    }
  }

  async function reconcileSession(snapshot) {
    if (!snapshot) return;

    switch (snapshot.sessionStatus) {
      case 'unknown':
      case 'restoring':
        showBootstrapView();
        return;

      case 'authenticated':
        await revealAuthenticatedApp();
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

  function restoreSessionOnce() {
    if (sessionRestorePromise) return sessionRestorePromise;

    const engine = window.MIIMIID_AUTH_ENGINE;
    if (!engine?.loadCurrentUser) {
      sessionRestorePromise = Promise.reject(
        new Error('Miimiid auth engine is unavailable during bootstrap.')
      );
      return sessionRestorePromise;
    }

    sessionRestorePromise = Promise.resolve()
      .then(() => engine.loadCurrentUser())
      .catch((error) => {
        console.error('Miimiid session restoration failed:', error);
        return null;
      });

    return sessionRestorePromise;
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
      void revealAuthenticatedApp();
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
      void reconcileSession(snapshot);
    });

    void restoreSessionOnce();
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
