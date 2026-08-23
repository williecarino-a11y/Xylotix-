import { AuthController } from './auth-engine/controller.js';
import { AuthRenderer } from './auth-engine/renderer.js';

(function () {
  'use strict';

  function resolveInitialFlow() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('resetToken')) return 'reset';
    return 'login';
  }

  function showAuthenticated(user) {
    const authView = document.getElementById('miimiid-auth-view');
    const appShell = document.getElementById('miimiid-app-shell');
    const authLoading = document.getElementById('miimiid-auth-loading');

    if (authView) authView.classList.add('hidden');
    if (authLoading) authLoading.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');
    document.documentElement.classList.remove('miimiid-auth-active');
    document.body.classList.remove('miimiid-auth-active');

    if (typeof window.initializeMiimiidDashboard === 'function') {
      Promise.resolve(window.initializeMiimiidDashboard(user)).catch(console.error);
    }
  }

  function boot() {
    if (window.MIIMIID_AUTH_ENGINE) return;

    const controller = new AuthController({
      flow: resolveInitialFlow(),
      onAuthenticated: showAuthenticated
    });

    const renderer = new AuthRenderer(controller);
    controller.render = () => renderer.render();
    renderer.bind();
    renderer.render();

    window.MIIMIID_AUTH_ENGINE = controller;
    window.MiimiidAuthController = controller;

    controller.restoreSession().then(user => {
      if (user) showAuthenticated(user);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
