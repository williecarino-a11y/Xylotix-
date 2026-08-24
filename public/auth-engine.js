import { AuthController } from './auth-engine/controller.js';
import { AuthRenderer } from './auth-engine/renderer.js';
import { AUTH_FLOW, AUTH_MODE_ACTIONS } from './auth-engine/config.js';

(function () {
  'use strict';

  const LABELS = {
    login: 'Sign in', register: 'Create account', forgot: 'Forgot password', reset: 'Reset password',
    welcome: 'Welcome to Miimiid', name: 'Your name', email: 'Your email', birthday: 'Your details',
    password: 'Create your password', verification: 'Verify your email', confirmation: 'Done',
    firstName: 'First name', lastName: 'Last name', password: 'Password', confirmPassword: 'Confirm password',
    gender: 'Gender', dateOfBirth: 'Birthday', code: 'Verification code', male: 'Male', female: 'Female',
    authContinue: 'Continue', authGetStarted: 'Get started', authSignIn: 'Sign in',
    authCreateAccountButton: 'Create account', authVerifyAccount: 'Verify', authResendCode: 'Resend code',
    authSendResetInstructions: 'Send reset instructions', authResetPasswordButton: 'Reset password'
  };

  function text(key) {
    try { const translated = window.miimiidDashboardTranslate?.(key); if (translated && translated !== key) return translated; } catch (_) {}
    return LABELS[key] || key;
  }

  function fieldMarkup(field) {
    const label = text(field.id);
    const required = field.required ? ' required' : '';
    if (field.type === 'select') return `<div class="miimiid-auth-field"><label for="${field.domId}">${label}${field.required ? ' *' : ''}</label><select id="${field.domId}" name="${field.id}"${required}><option value="">Select ${label.toLowerCase()}</option>${(field.options || []).map(v => `<option value="${v}">${text(v)}</option>`).join('')}</select></div>`;
    const type = field.type === 'birthday' ? 'date' : (field.type === 'verification' ? 'text' : field.type);
    const extra = field.type === 'verification' ? ' inputmode="numeric" maxlength="6" autocomplete="one-time-code"' : '';
    return `<div class="miimiid-auth-field"><label for="${field.domId}">${label}${field.required ? ' *' : ''}</label><input id="${field.domId}" name="${field.id}" type="${type}"${extra}${required}></div>`;
  }

  function actionMarkup(action, secondary = false) { return `<button type="button" id="${action.domId}" class="miimiid-auth-action${secondary ? ' secondary' : ''}">${text(action.label)}</button>`; }

  function createAuthShell() {
    if (document.getElementById('miimiid-auth-view')) return;

    const appShell = document.createElement('div');
    appShell.id = 'miimiid-app-shell';
    appShell.className = 'miimiid-app-shell';
    appShell.dataset.authEngineAppShell = '1';
    appShell.style.display = 'none';
    appShell.style.visibility = 'hidden';

    while (document.body.firstChild) appShell.appendChild(document.body.firstChild);
    document.body.appendChild(appShell);

    const auth = document.createElement('main');
    auth.id = 'miimiid-auth-view';
    auth.className = 'miimiid-auth-shell';
    auth.style.display = 'flex';
    auth.setAttribute('aria-label', 'Authentication');
    auth.innerHTML = `<div class="miimiid-auth-card"><div class="miimiid-auth-header"><strong>Miimiid</strong><div id="miimiid-auth-progress"></div></div><div id="miimiid-auth-status" class="miimiid-auth-status hidden" role="alert" aria-live="polite"></div><div id="miimiid-auth-content"></div></div>`;

    const content = auth.querySelector('#miimiid-auth-content');
    Object.entries(AUTH_FLOW).forEach(([flowName, flow]) => {
      const form = document.createElement('form');
      form.id = `miimiid-${flowName}-form`;
      form.className = 'miimiid-auth-form hidden';
      form.noValidate = true;
      Object.entries(flow.steps).forEach(([stepId, step]) => {
        if (stepId === 'authenticated') return;
        const section = document.createElement('section');
        section.className = 'miimiid-auth-step';
        section.dataset.authStep = stepId;
        section.innerHTML = `<div class="miimiid-auth-copy"><h1>${text(stepId)}</h1></div><div class="miimiid-auth-fields">${(step.fields || []).map(fieldMarkup).join('')}</div><div class="miimiid-auth-actions">${step.primaryAction ? actionMarkup(step.primaryAction) : ''}${(step.secondaryActions || []).map(a => actionMarkup(a, true)).join('')}</div>`;
        form.appendChild(section);
      });
      content.appendChild(form);
    });

    const modeActions = document.createElement('nav');
    modeActions.className = 'miimiid-auth-modes';
    modeActions.innerHTML = AUTH_MODE_ACTIONS.map(({ domId, flow }) => `<button type="button" id="${domId}" class="miimiid-auth-mode">${text(flow)}</button>`).join('');
    content.appendChild(modeActions);
    document.body.insertBefore(auth, appShell);

    if (!document.getElementById('miimiid-auth-shell-style')) document.head.insertAdjacentHTML('beforeend', `<style id="miimiid-auth-shell-style">.miimiid-auth-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#0f172a;color:#f8fafc}.miimiid-auth-card{width:min(100%,460px);background:#1e293b;border:1px solid #334155;border-radius:24px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.35)}.miimiid-auth-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;font-size:1.25rem}.miimiid-auth-step h1{font-size:1.6rem;margin:0 0 20px}.miimiid-auth-field{display:grid;gap:7px;margin-bottom:16px}.miimiid-auth-field label{font-size:.9rem;font-weight:600}.miimiid-auth-field input,.miimiid-auth-field select{width:100%;min-height:50px;padding:13px 14px;border-radius:12px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:16px;box-sizing:border-box}.miimiid-auth-field input:focus,.miimiid-auth-field select:focus{outline:2px solid #38bdf8}.miimiid-auth-field-error{margin-top:-9px;margin-bottom:12px;color:#f87171;font-size:.82rem}.miimiid-auth-actions{display:grid;gap:10px;margin-top:20px}.miimiid-auth-action{position:relative;width:100%;min-height:50px;border:0;border-radius:12px;background:#0284c7;color:white;font-weight:700;font-size:16px}.miimiid-auth-action.secondary,.miimiid-auth-mode{background:transparent;color:#7dd3fc;border:1px solid #334155}.miimiid-auth-action:disabled{opacity:.55}.miimiid-auth-modes{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:18px}.miimiid-auth-mode{padding:9px 12px;border-radius:10px}.miimiid-auth-status{padding:12px;border-radius:10px;background:#450a0a;color:#fecaca;margin-bottom:16px}.miimiid-auth-shell .miimiid-auth-step.hidden{display:none!important}@media(max-width:520px){.miimiid-auth-shell{padding:16px}.miimiid-auth-card{padding:20px}}
    </style>`);
  }

  function showAuthenticated(user) {
    const authView = document.getElementById('miimiid-auth-view');
    const appShell = document.getElementById('miimiid-app-shell');
    if (authView) { authView.style.display = 'none'; authView.setAttribute('aria-hidden', 'true'); }
    if (appShell) { appShell.style.display = ''; appShell.style.visibility = ''; appShell.setAttribute('aria-hidden', 'false'); }
    if (typeof window.initializeMiimiidDashboard === 'function') window.initializeMiimiidDashboard(user).catch?.(console.error);
  }

  function boot() {
    if (window.MIIMIID_AUTH_ENGINE) return;
    createAuthShell();
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('resetToken');
    const forceAuth = params.get('auth') === '1';
    const initialFlow = resetToken ? 'reset' : 'login';
    const controller = new AuthController({ flow: initialFlow, onAuthenticated: showAuthenticated });
    const renderer = new AuthRenderer(controller);
    controller.render = () => renderer.render();
    renderer.bind();
    renderer.render();
    window.MIIMIID_AUTH_ENGINE = controller;
    window.MiimiidAuthController = controller;
    if (!resetToken && !forceAuth) controller.restoreSession().then(user => { if (user) showAuthenticated(user); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();