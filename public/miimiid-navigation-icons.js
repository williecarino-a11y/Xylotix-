(function () {
  'use strict';

  const ICONS = {
    home: `
      <svg class="miimiid-nav-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3.5 10.5 12 3.5l8.5 7" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M9.2 20v-5.8h5.6V20" />
      </svg>`,
    learn: `
      <svg class="miimiid-nav-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 5.2c-1.8-1.5-4-2.2-7.2-2.2v14.5c3.2 0 5.4.7 7.2 2.2" />
        <path d="M12 5.2c1.8-1.5 4-2.2 7.2-2.2v14.5c-3.2 0-5.4.7-7.2 2.2" />
        <path d="M12 5.2v14.5" />
      </svg>`,
    funCenter: `
      <svg class="miimiid-nav-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7.2 7.3h9.6c2.2 0 3.8 1.7 4.3 4.1l1 5.1c.4 2-1.9 3.2-3.2 1.7l-2.8-3.1H7.9l-2.8 3.1c-1.3 1.5-3.6.3-3.2-1.7l1-5.1c.5-2.4 2.1-4.1 4.3-4.1Z" />
        <path d="M7.2 11v4" />
        <path d="M5.2 13h4" />
        <path d="M16.3 11.8h.01" />
        <path d="M18.6 14.1h.01" />
      </svg>`,
    aiTutor: `
      <svg class="miimiid-nav-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M7 6.5h10c2.2 0 4 1.8 4 4v5c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4v-5c0-2.2 1.8-4 4-4Z" />
        <path d="M12 6.5V3" />
        <path d="M12 3h.01" />
        <path d="M3 11H1.8" />
        <path d="M21 11h1.2" />
        <circle cx="8.5" cy="13" r=".9" />
        <circle cx="15.5" cy="13" r=".9" />
        <path d="M8.5 16.2c1.9 1.2 5.1 1.2 7 0" />
      </svg>`
  };

  function applyIcons(nav) {
    if (!nav) return;

    nav.querySelectorAll('[data-dashboard-view]').forEach(button => {
      const view = button.dataset.dashboardView;
      const icon = ICONS[view];
      if (!icon || button.dataset.miimiidIconReady === 'true') return;

      const label = button.textContent.trim();
      button.innerHTML = `${icon}<span class="nav-label"></span>`;
      button.querySelector('.nav-label').textContent = label;
      button.dataset.miimiidIconReady = 'true';
    });
  }

  function init() {
    const nav = document.getElementById('miimiid-bottom-nav');
    if (!nav) {
      window.setTimeout(init, 50);
      return;
    }

    applyIcons(nav);

    const observer = new MutationObserver(() => applyIcons(nav));
    observer.observe(nav, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
