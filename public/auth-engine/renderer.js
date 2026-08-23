import { AUTH_STATUS } from './state.js';
import { AUTH_FLOW, AUTH_MODE_ACTIONS } from './config.js';

const FORM_IDS = { login: 'miimiid-login-form', register: 'miimiid-register-form', forgot: 'miimiid-forgot-form', reset: 'miimiid-reset-form' };
const FALLBACK_MESSAGES = {
  authRequired: 'This field is required.',
  authInvalidEmail: 'Enter a valid email address.',
  authPasswordTooShort: 'Password must be at least 8 characters.',
  authPasswordMismatch: 'Passwords do not match.',
  authBirthdayInvalid: 'Select a valid birthday.',
  authUnderageBirthday: 'You must be at least 18 years old.',
  authVerificationCodeRequired: 'Enter the 6-digit verification code.',
  authVerificationCodeInvalid: 'Enter a valid 6-digit verification code.',
  authGenderRequired: 'Select your gender.',
  authAuthenticated: 'You are authenticated.',
  authResetInstructionsSent: 'Password reset instructions have been sent.',
  authPasswordResetSuccess: 'Your password has been reset successfully.'
};
function t(key) {
  try { const translated = window.miimiidDashboardTranslate?.(key); if (translated && translated !== key) return translated; } catch (_) {}
  return FALLBACK_MESSAGES[key] || key;
}

export class AuthRenderer {
  constructor(controller) { this.controller = controller; this.style(); }

  style() {
    if (document.getElementById('miimiid-auth-engine-style')) return;
    const s = document.createElement('style');
    s.id = 'miimiid-auth-engine-style';
    s.textContent = '.miimiid-auth-v5-loading{position:relative!important;pointer-events:none!important}.miimiid-auth-v5-loading .miimiid-auth-v5-label{visibility:hidden}.miimiid-auth-v5-spinner{position:absolute;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);border:2px solid currentColor;border-right-color:transparent;border-bottom-color:transparent;border-radius:50%;animation:miimiidAuthSpin .65s linear infinite;display:none}@keyframes miimiidAuthSpin{to{transform:translate(-50%,-50%) rotate(360deg)}}';
    document.head.appendChild(s);
  }

  prepareGender() {
    const field = this.controller.flow.steps.birthday?.fields?.find(f => f.id === 'gender');
    if (!field || document.getElementById(field.domId)) return;
    const dobField = this.controller.flow.steps.birthday.fields.find(f => f.id === 'dateOfBirth');
    const dob = document.getElementById(dobField?.domId);
    if (!dob) return;
    const p = dob.closest('.miimiid-auth-field') || dob.parentElement;
    const w = document.createElement('div');
    w.className = p?.className || 'miimiid-auth-field';
    w.innerHTML = `<label for="${field.domId}">${t('authGender') || 'Gender'}</label><select id="${field.domId}"><option value="">${t('authSelectGender') || 'Select gender'}</option>${(field.options || []).map(v => `<option value="${v}">${t(v === 'male' ? 'authMale' : 'authFemale')}</option>`).join('')}</select>`;
    (p?.parentElement || dob.parentElement).insertBefore(w, p || dob);
  }

  prepareSteps() {
    if (this.controller.state.flow !== 'register') return;
    const form = document.getElementById(FORM_IDS.register);
    if (!form) return;
    const stepIds = Object.keys(this.controller.flow.steps).filter(id => id !== 'authenticated');
    stepIds.forEach(stepId => {
      const step = this.controller.flow.steps[stepId];
      const target = step.fields.map(f => document.getElementById(f.domId)).find(Boolean) || document.getElementById(step.primaryAction?.domId);
      if (!target) return;
      const section = target.closest('[data-register-step],section,.miimiid-auth-step,.auth-step,.form-step,.registration-step') || target.parentElement;
      if (section && !section.dataset.registerStep) section.dataset.registerStep = stepId;
    });
  }

  bind() {
    this.prepareGender(); this.prepareSteps();
    const fields = new Map();
    Object.values(AUTH_FLOW).forEach(flow => Object.values(flow.steps).forEach(step => (step.fields || []).forEach(field => fields.set(field.domId, field.id))));
    fields.forEach((fieldId, domId) => {
      const el = document.getElementById(domId);
      if (!el || el.dataset.authEngineBound) return;
      el.dataset.authEngineBound = '1';
      const changed = () => this.controller.fieldChanged(fieldId, el.value);
      el.addEventListener('input', changed); el.addEventListener('change', changed);
      el.addEventListener('focus', () => this.controller.fieldFocused(fieldId));
      el.addEventListener('blur', () => this.controller.fieldBlurred(fieldId));
    });
    Object.values(AUTH_FLOW).forEach(flow => Object.values(flow.steps).forEach(step => {
      if (step.primaryAction?.domId) this.bindAction(step.primaryAction);
      (step.secondaryActions || []).forEach(action => this.bindAction(action));
    }));
    AUTH_MODE_ACTIONS.forEach(({ domId, flow }) => {
      const b = document.getElementById(domId);
      if (b && !b.dataset.authEngineModeBound) { b.dataset.authEngineModeBound = '1'; b.addEventListener('click', e => { e.preventDefault(); this.controller.setFlow(flow); }); }
    });
  }

  bindAction(action) {
    const b = document.getElementById(action.domId);
    if (!b || b.dataset.authEngineActionBound) return;
    b.dataset.authEngineActionBound = '1';
    b.addEventListener('click', e => { e.preventDefault(); if (action.id === 'resend') this.controller.secondaryAction(action.id); else this.controller.primaryAction(); });
  }

  renderFields() {
    const state = this.controller.state;
    for (const field of this.controller.step?.fields || []) {
      const el = document.getElementById(field.domId);
      if (!el) continue;
      const value = state.form.values[field.id] ?? '';
      if (el.value !== value) el.value = value;
      el.disabled = Boolean(field.disabled || state.request.status === 'loading');
      el.setAttribute('aria-invalid', String(Boolean(state.form.touched[field.id] && state.form.errors[field.id])));
    }
  }

  errors() {
    const state = this.controller.state;
    for (const field of this.controller.step?.fields || []) {
      const el = document.getElementById(field.domId);
      if (!el) continue;
      const error = state.form.touched[field.id] ? state.form.errors[field.id] : null;
      const p = el.closest('.miimiid-auth-field') || el.parentElement;
      if (!p) continue;
      let n = p.querySelector('[data-auth-engine-error]');
      if (!n) { n = document.createElement('div'); n.dataset.authEngineError = '1'; n.className = 'miimiid-auth-field-error'; p.appendChild(n); }
      n.textContent = error ? t(error.code) : '';
      n.hidden = !error;
    }
  }

  button(action) {
    const b = document.getElementById(action.domId); if (!b) return;
    const state = this.controller.state;
    const loading = state.request.status === 'loading' && state.request.action === action.id;
    const disabled = loading || state.status === AUTH_STATUS.VALIDATING || !this.controller.canContinue;
    if (!b.querySelector('.miimiid-auth-v5-spinner')) { const h = b.innerHTML; b.innerHTML = `<span class="miimiid-auth-v5-label">${h}</span><span class="miimiid-auth-v5-spinner" aria-hidden="true"></span>`; }
    b.disabled = disabled; b.setAttribute('aria-busy', String(loading)); b.setAttribute('aria-disabled', String(disabled)); b.classList.toggle('miimiid-auth-v5-loading', loading); b.querySelector('.miimiid-auth-v5-spinner').style.display = loading ? 'block' : 'none';
  }

  render() {
    const state = this.controller.state;
    this.prepareGender(); this.prepareSteps();
    Object.entries(FORM_IDS).forEach(([mode, id]) => document.getElementById(id)?.classList.toggle('hidden', mode !== state.flow));
    if (state.flow === 'register') document.querySelectorAll('#miimiid-register-form [data-register-step]').forEach(el => el.classList.toggle('hidden', el.dataset.registerStep !== state.step));
    this.renderFields();
    if (this.controller.step?.primaryAction) this.button(this.controller.step.primaryAction);
    (this.controller.step?.secondaryActions || []).forEach(action => this.button(action));
    this.errors();
    const status = document.getElementById('miimiid-auth-status');
    if (status) { status.textContent = state.error?.message || (this.controller.step?.message ? t(this.controller.step.message) : ''); status.classList.toggle('hidden', !status.textContent); }
  }
}
