(function () {
  'use strict';

  const FUN_CENTER_PATH = '/api/learn/fun-center';
  let activitiesPromise = null;

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

          if (typeof miimiidFunCenterActivities !== 'undefined') {
            miimiidFunCenterActivities = activities;
          } else {
            window.miimiidFunCenterActivities = activities;
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
    if (typeof window.miimiidNavigate !== 'function' || window.miimiidNavigate.__miimiidFunCenterRuntimeWrapped) {
      return false;
    }

    const originalNavigate = window.miimiidNavigate;

    const wrappedNavigate = async function (view) {
      if (view === 'funCenter') {
        try {
          await loadActivities();
        } catch (error) {
          console.error('Miimiid Fun Center data load failed:', error);
        }
      }

      return originalNavigate.apply(this, arguments);
    };

    wrappedNavigate.__miimiidFunCenterRuntimeWrapped = true;
    window.miimiidNavigate = wrappedNavigate;
    return true;
  }

  function init() {
    if (!wrapNavigation()) {
      queueMicrotask(() => wrapNavigation());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
