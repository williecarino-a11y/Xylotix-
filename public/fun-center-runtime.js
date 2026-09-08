(function () {
  'use strict';

  const FUN_CENTER_PATH = '/api/learn/fun-center';
  const INSTALL_RETRY_MS = 25;
  const INSTALL_TIMEOUT_MS = 10000;
  let activitiesPromise = null;
  let wrapped = false;

  async function loadActivities() {
    if (!activitiesPromise) {
      activitiesPromise = fetch(FUN_CENTER_PATH, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Fun Center request failed: ${response.status}`);
          return response.json();
        })
        .then((payload) => {
          const activities = payload && payload.status === 'success' && Array.isArray(payload.data)
            ? payload.data
            : [];

          // Keep both bindings populated because the legacy renderer may read
          // either the global property or the global lexical binding.
          window.miimiidFunCenterActivities = activities;
          try {
            if (typeof miimiidFunCenterActivities !== 'undefined') {
              miimiidFunCenterActivities = activities;
            }
          } catch (_) {
            // The window property above is the fallback for lexical bindings
            // that are not writable from this script context.
          }

          return activities;
        })
        .catch((error) => {
          activitiesPromise = null;
          throw error;
        });
    }

    return activitiesPromise;
  }

  function wrapNavigation() {
    if (wrapped) return true;

    const navigate = window.miimiidNavigate;
    if (typeof navigate !== 'function' || navigate.__miimiidFunCenterRuntimeWrapped) {
      return false;
    }

    const wrappedNavigate = async function (view) {
      if (view === 'funCenter') {
        try {
          await loadActivities();
        } catch (error) {
          console.error('Miimiid Fun Center data load failed:', error);
        }
      }

      return navigate.apply(this, arguments);
    };

    wrappedNavigate.__miimiidFunCenterRuntimeWrapped = true;
    window.miimiidNavigate = wrappedNavigate;
    wrapped = true;
    return true;
  }

  function installNavigationHook() {
    if (wrapNavigation()) return;

    const startedAt = Date.now();
    const retry = () => {
      if (wrapNavigation()) return;
      if (Date.now() - startedAt < INSTALL_TIMEOUT_MS) {
        window.setTimeout(retry, INSTALL_RETRY_MS);
      } else {
        console.warn('Miimiid Fun Center runtime could not attach to navigation.');
      }
    };

    window.setTimeout(retry, INSTALL_RETRY_MS);
  }

  function init() {
    installNavigationHook();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
