import { AuthController } from './auth-engine/controller.js';
import { AuthRenderer } from './auth-engine/renderer.js';

(function () {
  'use strict';

  function isolateAuthDom() {
    const root = document.getElementById('miimiid-auth-view');
    if (!root || root.dataset.authEngineIsolated === '1') return root;

    // The legacy inline authentication code may already have attached DOM
    // listeners before this module executes. Clone the auth subtree so those
    // listeners cannot compete with the new engine. The clone preserves the
    // existing visual markup and values but not addEventListener handlers.
    const clone = root.cloneNode(true);
    clone.dataset.authEngineIsolated = '1';
    clone.querySelectorAll('[data-auth-engine-bound],[data-auth-engine-action-bound],[data-auth-engine-mode-bound]').forEach(el => {
      delete el.dataset.authEngineBound;
      delete el.dataset.authEngineActionBound;
      delete el.dataset.authEngineModeBound;
    });
    root.replaceWith(clone);
    return clone;
  }

  function showAuthenticated(user) {
    const authView = document.getElementById('miimiid-auth-view');
    const appShell = document.getElementById('miimiid-app-shell');
    const authLoading = document.getElementById('miimiid-auth-loading');
    if (authView) authView.classList.add('hidden');
    if (authLoading) authLoading.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');
    if (typeof window.initializeMiimiidDashboard === 'function') window.initializeMiimiidDashboard(user).catch?.(console.error);
  }

  function boot() {
    if (window.MIIMIID_AUTH_ENGINE) return;

    isolateAuthDom();

    const resetToken = new URLSearchParams(window.location.search).get('resetToken');
    const initialFlow = resetToken ? 'reset' : 'login';
    const controller = new AuthController({ flow: initialFlow, onAuthenticated: showAuthenticated });
    const renderer = new AuthRenderer(controller);
    controller.render = () => renderer.render();

    renderer.bind();
    renderer.render();

    window.MIIMIID_AUTH_ENGINE = controller;
    window.MiimiidAuthController = controller;

    if (!resetToken) {
      controller.restoreSession().then(user => {
        if (user) showAuthenticated(user);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
