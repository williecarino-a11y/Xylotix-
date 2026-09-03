(() => {
  'use strict';

  const DESKTOP_QUERY = '(min-width: 768px)';

  function syncDesktopNavigation() {
    const nav = document.querySelector('.miimiid-bottom-nav');
    if (!nav) return;

    const dashboard = document.querySelector('.miimiid-dashboard.active');
    const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;

    if (!isDesktop || !dashboard) {
      nav.removeAttribute('data-desktop-visible');
      return;
    }

    // The legacy shell can leave the navigation with the global .hidden class.
    // Desktop navigation is a first-class part of the authenticated app shell,
    // so remove only that stale state when the dashboard is active.
    nav.classList.remove('hidden');
    nav.removeAttribute('hidden');
    nav.style.removeProperty('display');
    nav.setAttribute('data-desktop-visible', 'true');
  }

  function start() {
    syncDesktopNavigation();

    const media = window.matchMedia(DESKTOP_QUERY);
    media.addEventListener?.('change', syncDesktopNavigation);

    const observer = new MutationObserver(syncDesktopNavigation);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'hidden']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
