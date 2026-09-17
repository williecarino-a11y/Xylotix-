/**
 * Miimiid authentication bootstrap owner.
 *
 * The large legacy index template still contains the original application
 * initializer. server.js routes its DOMContentLoaded invocation through the
 * hook below so this file is the single browser bootstrap owner.
 *
 * MIIMIID_AUTH_ENGINE remains the single owner of session state and the
 * /api/auth/me request. This hook owns only the page bootstrap lifecycle.
 */
(function (window, document) {
  'use strict';

  const BOOT_TIMEOUT_MS = 18000;
  let bootPromise = null;
  let dashboardPromise = null;
  let booted = false;
  let navigationIconsLoaded = false;

  function selectors() {
    return {
      auth: document.querySelector('#miimiid-auth-view'),
      loading: document.querySelector('#miimiid-auth-loading'),
      card: document.querySelector('#miimiid-auth-card'),
      shell: document.querySelector('#miimiid-app-shell')
    };
  }

  function stopBootstrapLoader() {
    if (window.ContinueLoading?.stopAll) {
      window.ContinueLoading.stopAll('auth-bootstrap');
    }
  }

  function showLoginView() {
    const { auth, loading, card, shell } = selectors();
    shell?.classList.add('hidden');
    document.querySelectorAll('.miimiid-dashboard').forEach((node) => node.classList.remove('active'));
    loading?.classList.add('hidden');
    auth?.classList.remove('hidden');
    card?.classList.remove('hidden');
  }

  function showBootstrapView() {
    const { auth, loading, card, shell } = selectors();
    shell?.classList.add('hidden');
    document.querySelectorAll('.miimiid-dashboard').forEach((node) => node.classList.remove('active'));
    auth?.classList.add('hidden');
    card?.classList.add('hidden');
    loading?.classList.remove('hidden');
  }

  function exposeAuthenticatedShell() {
    const { auth, loading, shell } = selectors();
    if (!window.currentUser && !window.MIIMIID_CURRENT_USER) {
      showLoginView();
      return false;
    }
    loading?.classList.add('hidden');
    auth?.classList.add('hidden');
    shell?.classList.remove('hidden');
    return true;
  }

  function initializeDashboardOnce() {
    if (dashboardPromise) return dashboardPromise;

    if (typeof window.initializeMiimiidDashboard !== 'function') {
      return Promise.reject(new Error('Miimiid dashboard initializer is unavailable.'));
    }

    dashboardPromise = Promise.resolve()
      .then(() => window.initializeMiimiidDashboard())
      .then((ready) => {
        if (ready !== true) {
          throw new Error('Miimiid dashboard initialization did not complete successfully.');
        }
        return true;
      })
      .catch((error) => {
        dashboardPromise = null;
        throw error;
      });

    return dashboardPromise;
  }

  function loadNavigationIcons() {
    if (navigationIconsLoaded || document.querySelector('script[data-miimiid-navigation-icons]')) return;
    navigationIconsLoaded = true;

    const script = document.createElement('script');
    script.src = '/miimiid-navigation-icons.js';
    script.defer = true;
    script.dataset.miimiidNavigationIcons = 'true';
    document.head.appendChild(script);
  }

  async function initializeApplication() {
    if (bootPromise) return bootPromise;

    bootPromise = (async function () {
      showBootstrapView();
      loadNavigationIcons();

      const engine = window.MIIMIID_AUTH_ENGINE;
      if (!engine?.loadCurrentUser) {
        throw new Error('Miimiid auth engine is unavailable during bootstrap.');
      }

      let user;
      try {
        user = await engine.loadCurrentUser();
      } catch (error) {
        console.error('Miimiid session restoration failed:', error);
        showLoginView();
        stopBootstrapLoader();
        return false;
      }

      if (!user) {
        showLoginView();
        stopBootstrapLoader();
        booted = true;
        return false;
      }

      try {
        await initializeDashboardOnce();
        const exposed = exposeAuthenticatedShell();
        stopBootstrapLoader();
        booted = exposed;
        return exposed;
      } catch (error) {
        console.error('Miimiid authenticated shell initialization failed:', error);
        showLoginView();
        stopBootstrapLoader();
        booted = false;
        return false;
      }
    })();

    return bootPromise;
  }

  function handleSessionChange(snapshot) {
    if (!booted || !snapshot) return;

    if (snapshot.sessionStatus === 'unauthenticated' || snapshot.sessionStatus === 'expired' || snapshot.sessionStatus === 'error') {
      booted = false;
      showLoginView();
      return;
    }

    if (snapshot.sessionStatus === 'authenticated' && snapshot.user) {
      exposeAuthenticatedShell();
    }
  }

  window.MIIMIID_AUTH_BOOTSTRAP = initializeApplication;

  const engine = window.MIIMIID_AUTH_ENGINE;
  if (engine?.subscribe) {
    engine.subscribe(handleSessionChange);
  }
})(window, document);
