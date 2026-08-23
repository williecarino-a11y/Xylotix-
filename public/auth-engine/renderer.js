import { AUTH_STATUS } from './state.js';
import { FieldRegistry } from './registry.js';

const FORM_IDS = { login: 'miimiid-login-form', register: 'miimiid-register-form', forgot: 'miimiid-forgot-form', reset: 'miimiid-reset-form' };
const ELEMENTS = {
  login: { email: 'miimiid-login-identifier', password: 'miimiid-login-password', action: 'miimiid-login-submit' },
  name: { firstName: 'miimiid-register-first-name', lastName: 'miimiid-register-last-name', action: 'miimiid-register-name-next' },
  email: { email: 'miimiid-register-email', action: 'miimiid-register-contact-next' },
  birthday: { gender: 'miimiid-register-gender', dateOfBirth: 'miimiid-register-dob', action: 'miimiid-register-details-next' },
  password: { password: 'miimiid-register-password', confirmPassword: 'miimiid-register-confirm', action: 'miimiid-register-submit' },
  verification: { code: 'miimiid-register-verification-code', action: 'miimiid-verify-account-submit', resend: 'miimiid-resend-verification' },
  forgot: { email: 'miimiid-forgot-identifier', action: 'miimiid-forgot-submit' },
  reset: { password: 'miimiid-reset-password', confirmPassword: 'miimiid-reset-confirm', action: 'miimiid-reset-submit' }
};

function translate(key, fallback) {
  try { if (typeof window.miimiidDashboardTranslate === 'function') { const v = window.miimiidDashboardTranslate(key); if (v && v !== key) return v; } } catch (_) {}
  return fallback || key;
}

export class AuthRenderer {
  constructor(controller) { this.controller = controller; this.prepare(); }

  prepare() {
    document.querySelectorAll('[data-auth-engine-field]').forEach(el => {
      el.addEventListener('input', () => this.controller.fieldChanged(el.dataset.authEngineField, el.value));
      el.addEventListener('change', () => this.controller.fieldChanged(el.dataset.authEngineField, el.value));
      el.addEventListener('blur', () => this.controller.form.touch(el.dataset.authEngineField));
    });
    document.querySelectorAll('[data-auth-engine-mode]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); this.controller.setFlow(el.dataset.authEngineMode); }));
  }

  element(field) { return document.getElementById(ELEMENTS[this.controller.state.step]?.[field] || ''); }

  bindDynamicFields() {
    const step = this.controller.step;
    for (const field of step?.fields || []) {
      const id = ELEMENTS[step.id]?.[field.id];
      const el = id ? document.getElementById(id) : null;
      if (!el || el.dataset.authEngineBound === 'true') continue;
      el.dataset.authEngineBound = 'true';
      el.dataset.authEngineField = field.id;
      el.addEventListener('input', () => this.controller.fieldChanged(field.id, el.value));
      el.addEventListener('change', () => this.controller.fieldChanged(field.id, el.value));
      el.addEventListener('focus', () => this.controller.form.fields[field.id] && (this.controller.form.fields[field.id].state = 'focused'));
      el.addEventListener('blur', () => this.controller.form.touch(field.id));
    }
  }

  prepareGender() {
    const existing = document.getElementById('miimiid-register-gender');
    if (existing) return;
    const dob = document.getElementById('miimiid-register-dob');
    if (!dob) return;
    const parent = dob.closest('.miimiid-auth-field') || dob.parentElement;
    const wrapper = document.createElement('div');
    wrapper.className = parent?.className || 'miimiid-auth-field';
    wrapper.innerHTML = `<label for="miimiid-register-gender">${translate('authGender','Gender')}</label><select id="miimiid-register-gender" data-auth-engine-field="gender"><option value="">${translate('authSelectGender','Select gender')}</option><option value="male">${translate('authMale','Male')}</option><option value="female">${translate('authFemale','Female')}</option></select>`;
    (parent?.parentElement || dob.parentElement).insertBefore(wrapper, parent || dob);
  }

  prepareRegisterSteps() {
    const form = document.getElementById(FORM_IDS.register);
    if (!form) return;
    const existing = form.querySelectorAll('[data-register-step]');
    if (existing.length >= 6) return;
    const groups = [
      ['miimiid-register-get-started'],
      ['miimiid-register-first-name','miimiid-register-last-name'],
      ['miimiid-register-email'],
      ['miimiid-register-gender','miimiid-register-dob'],
      ['miimiid-register-password','miimiid-register-confirm','miimiid-register-submit'],
      ['miimiid-register-verification-code','miimiid-verify-account-submit']
    ];
    groups.forEach((ids, index) => {
      const anchor = ids.map(id => document.getElementById(id)).find(Boolean);
      if (!anchor) return;
      const section = anchor.closest('[data-register-step], section, .miimiid-auth-step, .auth-step, .form-step, .registration-step') || anchor.parentElement;
      if (section && !section.dataset.registerStep) section.dataset.registerStep = String(index + 1);
    });
  }

  button(action, stepId) {
    const id = ELEMENTS[stepId]?.action;
    const button = id ? document.getElementById(id) : null;
    if (!button) return;
    const loading = this.controller.state.request.status === 'loading' && this.controller.state.request.action === action.id;
    button.disabled = loading;
    button.setAttribute('aria-busy', String(loading));
    button.classList.toggle('miimiid-auth-v5-loading', loading);
    if (!button.querySelector('.miimiid-auth-v5-spinner')) {
      const html = button.innerHTML;
      button.innerHTML = `<span class="miimiid-auth-v5-label">${html}</span><span class="miimiid-auth-v5-spinner" aria-hidden="true"></span>`;
    }
  }

  errors() {
    for (const field of this.controller.step?.fields || []) {
      const id = ELEMENTS[this.controller.state.step]?.[field.id];
      const el = id ? document.getElementById(id) : null;
      if (!el) continue;
      const error = this.controller.state.form.errors[field.id];
      el.setAttribute('aria-invalid', String(Boolean(error)));
      const parent = el.closest('.miimiid-auth-field') || el.parentElement;
      if (!parent) continue;
      let node = parent.querySelector('[data-auth-engine-error]');
      if (!node) { node = document.createElement('div'); node.dataset.authEngineError = 'true'; node.className = 'miimiid-auth-field-error'; parent.appendChild(node); }
      node.textContent = error ? translate(error.code, 'Please check this field.') : '';
      node.hidden = !error;
    }
  }

  render() {
    const state = this.controller.state;
    this.prepareGender();
    this.prepareRegisterSteps();
    this.bindDynamicFields();
    Object.entries(FORM_IDS).forEach(([mode, id]) => document.getElementById(id)?.classList.toggle('hidden', mode !== state.flow));
    if (state.flow === 'register') document.querySelectorAll('#miimiid-register-form [data-register-step]').forEach(el => el.classList.toggle('hidden', Number(el.dataset.registerStep) !== ({welcome:1,name:2,email:3,birthday:4,password:5,verification:6}[state.step])));
    const action = this.controller.step?.primaryAction;
    if (action) this.button(action, state.step);
    this.errors();
    const status = document.getElementById('miimiid-auth-status');
    if (status) {
      status.textContent = state.error?.message || '';
      status.classList.toggle('hidden', !state.error);
    }
  }
}
