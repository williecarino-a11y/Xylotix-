(function () {
  'use strict';

  const FUN_CENTER_PATH = '/api/learn/fun-center';
  const INSTALL_RETRY_MS = 25;
  const INSTALL_TIMEOUT_MS = 10000;
  let activitiesPromise = null;
  let wrapped = false;

  const labels = {
    funCenterNeedsWantsTitle: 'Needs vs Wants'
  };

  function translate(key) {
    try {
      if (typeof window.miimiidTranslate === 'function') {
        const translated = window.miimiidTranslate(key);
        if (translated && translated !== key) return translated;
      }
    } catch (_) {}
    return labels[key] || key;
  }

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
          window.miimiidFunCenterActivities = activities;
          return activities;
        })
        .catch((error) => {
          activitiesPromise = null;
          throw error;
        });
    }
    return activitiesPromise;
  }

  function renderActivities(activities) {
    const view = document.querySelector('.miimiid-fun-center-view');
    if (!view || !Array.isArray(activities) || !activities.length) return;

    let content = view.querySelector('#fun-center-content');
    if (!content) {
      content = document.createElement('div');
      content.id = 'fun-center-content';
      view.appendChild(content);
    }

    if (content.querySelector('.miimiid-fun-node')) return;

    const fragment = document.createDocumentFragment();
    activities.forEach((activity) => {
      const node = document.createElement('article');
      node.className = 'miimiid-fun-node';
      node.dataset.gameId = activity.id || '';

      const title = document.createElement('h3');
      title.className = 'miimiid-fun-node-label';
      title.textContent = translate(activity.titleKey);
      node.appendChild(title);

      if (Array.isArray(activity.rounds) && activity.rounds.length) {
        const list = document.createElement('div');
        list.className = 'miimiid-fun-node-rounds';
        activity.rounds.forEach((round) => {
          const item = document.createElement('div');
          item.className = 'miimiid-fun-node-round';
          item.textContent = `${round.visual || ''} ${translate(round.textKey)}`.trim();
          list.appendChild(item);
        });
        node.appendChild(list);
      }

      fragment.appendChild(node);
    });
    content.appendChild(fragment);
  }

  async function syncActivities() {
    try {
      const activities = await loadActivities();
      renderActivities(activities);
    } catch (error) {
      console.error('Miimiid Fun Center data load failed:', error);
    }
  }

  function wrapNavigation() {
    if (wrapped) return true;
    const navigate = window.miimiidNavigate;
    if (typeof navigate !== 'function' || navigate.__miimiidFunCenterRuntimeWrapped) return false;

    const wrappedNavigate = async function (view) {
      if (view === 'funCenter') await syncActivities();
      const result = navigate.apply(this, arguments);
      if (view === 'funCenter') {
        Promise.resolve(result).then(() => {
          renderActivities(window.miimiidFunCenterActivities || []);
        });
      }
      return result;
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
      if (Date.now() - startedAt < INSTALL_TIMEOUT_MS) window.setTimeout(retry, INSTALL_RETRY_MS);
    };
    window.setTimeout(retry, INSTALL_RETRY_MS);
  }

  function init() {
    installNavigationHook();
    // Preload the authenticated catalog so rendering does not depend on
    // whether the legacy inline navigation function is exposed on window.
    syncActivities();

    document.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      if ((button.textContent || '').trim() === 'Fun Center') {
        syncActivities();
        window.setTimeout(() => renderActivities(window.miimiidFunCenterActivities || []), 0);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
