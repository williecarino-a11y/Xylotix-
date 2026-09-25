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

  function authViewIsActive() {
  const { auth, card } = selectors();

  return Boolean(
    auth &&
    !auth.classList.contains('hidden') &&
    card &&
    !card.classList.contains('hidden')
  );
  }

  function stopBootstrapLoader() {
    if (window.ContinueLoading?.stopAll) {
      window.ContinueLoading.stopAll('auth-bootstrap');
    }
  }

  function revealAuthView() {
    const { auth, loading, card, shell } = selectors();

    shell?.classList.add('hidden');

    document
      .querySelectorAll('.miimiid-dashboard')
      .forEach((node) => node.classList.remove('active'));

    loading?.classList.add('hidden');
    auth?.classList.remove('hidden');
    card?.classList.remove('hidden');
  }

  function showLoginView(forceLoginMode = false) {
    revealAuthView();

    if (
      forceLoginMode &&
      typeof window.showMiimiidAuthView === 'function'
    ) {
      window.showMiimiidAuthView();
    }

    if (
      forceLoginMode &&
      typeof window.showMiimiidAuthMode === 'function'
    ) {
      window.showMiimiidAuthMode('login');
    }
  }

  function showBootstrapView() {
    const { auth, loading, card, shell } = selectors();

    shell?.classList.add('hidden');

    document
      .querySelectorAll('.miimiid-dashboard')
      .forEach((node) => node.classList.remove('active'));

    auth?.classList.add('hidden');
    card?.classList.add('hidden');
    loading?.classList.remove('hidden');
  }

  function exposeAuthenticatedShell(user) {
  const { auth, loading, shell } = selectors();

  if (!user) {
    showLoginView(true);
    return false;
  }

  loading?.classList.add('hidden');
  auth?.classList.add('hidden');
  shell?.classList.remove('hidden');

  return true;
  }

  function initializeDashboardOnce() {
    if (dashboardPromise) {
      return dashboardPromise;
    }

    if (
      typeof window.initializeMiimiidDashboard !== 'function'
    ) {
      return Promise.reject(
        new Error(
          'Miimiid dashboard initializer is unavailable.'
        )
      );
    }

    dashboardPromise = Promise.resolve()
      .then(() => window.initializeMiimiidDashboard())
      .then((ready) => {
        if (ready !== true) {
          throw new Error(
            'Miimiid dashboard initialization did not complete successfully.'
          );
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
    if (
      navigationIconsLoaded ||
      document.querySelector(
        'script[data-miimiid-navigation-icons]'
      )
    ) {
      return;
    }

    navigationIconsLoaded = true;

    const script = document.createElement('script');

    script.src = '/miimiid-navigation-icons.js';
    script.defer = true;
    script.dataset.miimiidNavigationIcons = 'true';

    document.head.appendChild(script);
  }

  async function initializeApplication() {
    if (bootPromise) {
      return bootPromise;
    }

    bootPromise = (async function () {
      showBootstrapView();
      loadNavigationIcons();

      const engine = window.MIIMIID_AUTH_ENGINE;

      if (!engine?.loadCurrentUser) {
        throw new Error(
          'Miimiid auth engine is unavailable during bootstrap.'
        );
      }

      let user;

      try {
  user = await engine.loadCurrentUser();

  window.currentUser = user || null;
  window.MIIMIID_CURRENT_USER = user || null;
} catch (error) {
  console.error(
    'Miimiid session restoration failed:',
    error
  );

  bootPromise = null;

  showLoginView(true);
  stopBootstrapLoader();

  return false;
      }

      if (!user) {
  bootPromise = null;

  /*
   * The user may have entered registration while the initial
   * session restoration request was still in flight.
   *
   * Do not force the login renderer here because doing so can
   * reset an active registration step.
   *
   * If the auth view is already active, preserve its current
   * mode and step. Otherwise, expose the normal login view.
   */
  if (authViewIsActive()) {
    revealAuthView();
  } else {
    showLoginView(true);
  }

  stopBootstrapLoader();

  booted = true;

  return false;
      }

      try {
        await initializeDashboardOnce();

        const exposed = exposeAuthenticatedShell(user);

        stopBootstrapLoader();

        booted = exposed;

        return exposed;
      } catch (error) {
        console.error(
          'Miimiid authenticated shell initialization failed:',
          error
        );

        bootPromise = null;

        showLoginView(true);
        stopBootstrapLoader();

        booted = false;

        return false;
      }
    })();

    return bootPromise;
  }

  async function handleSessionChange(snapshot) {
    if (!snapshot) {
      return;
    }

    if (
      snapshot.sessionStatus === 'unauthenticated' ||
      snapshot.sessionStatus === 'expired' ||
      snapshot.sessionStatus === 'error'
    ) {
      booted = false;

      /*
       * Passive session changes must not invoke the auth renderer.
       * The renderer resets the mode, which can hide an active
       * registration step immediately after the user clicks Register.
       *
       * Only reveal the existing auth view here.
       */
      revealAuthView();

      return;
    }

    if (
      snapshot.sessionStatus === 'authenticated' &&
      snapshot.user
    ) {
      if (booted) {
  exposeAuthenticatedShell(snapshot.user);
  return;
      }

      try {
        await initializeDashboardOnce();

        exposeAuthenticatedShell(snapshot.user);

        booted = true;

        stopBootstrapLoader();
      } catch (error) {
        console.error(
          'Miimiid authenticated session recovery failed:',
          error
        );

        revealAuthView();

        booted = false;
      }
    }
  }

  window.MIIMIID_AUTH_BOOTSTRAP = initializeApplication;

  const engine = window.MIIMIID_AUTH_ENGINE;

  if (engine?.subscribe) {
    engine.subscribe(handleSessionChange);
  }

  /*
   * Do not rely exclusively on server-side rewriting of the legacy
   * inline initializer.
   *
   * The guard owns startup, so it must be able to start itself even
   * when the legacy listener changes or is absent in a future template.
   */
  const startBootstrap = () => {
    initializeApplication().catch((error) => {
      console.error(
        'Miimiid authentication bootstrap failed:',
        error
      );

      revealAuthView();
      stopBootstrapLoader();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      startBootstrap,
      { once: true }
    );
  } else {
    startBootstrap();
  }
})(window, document);
