/**
 * Miimiid authentication bootstrap compatibility hook.
 *
 * The legacy application initializer in public/index.html owns the browser
 * bootstrap lifecycle, including session restoration, dashboard initialization,
 * and the final authenticated shell transition. MIIMIID_AUTH_ENGINE owns the
 * session request/state. This file must remain passive so it cannot race either
 * owner or overwrite their UI decisions.
 */
(function () {
  'use strict';

  function loadNavigationIcons() {
    if (document.querySelector('script[data-miimiid-navigation-icons]')) return;

    const script = document.createElement('script');
    script.src = '/miimiid-navigation-icons.js';
    script.defer = true;
    script.dataset.miimiidNavigationIcons = 'true';
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavigationIcons, { once: true });
  } else {
    loadNavigationIcons();
  }
})();
