import { AUTH_STATUS } from './state.js';

const FLOW_LABELS = {
  login: { title: 'authWelcome', subtitle: 'authSignInSubtitle' },
  register: { title: 'authCreateAccount', subtitle: 'authCreateSubtitle' },
  forgot: { title: 'authResetPassword', subtitle: 'authResetSubtitle' },
  reset: { title: 'authResetPasswordTitle', subtitle: 'authResetPasswordSubtitle' }
};

function t(key, fallback) {
  try {
    const translated = window.miimiidDashboardTranslate?.(key);
    if (translated && translated !== key) return translated;
  } catch (_) {}
  return fallback || key;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fieldLabel(field) {
  const labels = {
    email: ['authEmail', 'Email'],
    password: ['authPassword', 'Password'],
    confirmPassword: ['authConfirmPassword', 'Confirm password'],
    firstName: ['authFirstName', 'First name'],
    lastName: ['authLastName', 'Last name'],
    gender: ['authGender', 'Gender'],
    dateOfBirth: ['authBirthday', 'Birthday'],
    code: ['authVerificationCode', 'Verification code']
  };
  const entry = labels[field.id] || [field.id, field.id];
  return t(entry[0], entry[1]);
}

function inputType(field) {
  if (field.type === 'password') return 'password';
  if (field.type === 'email') return 'email';
  if (field.type === 'birthday') return 'date';
  return 'text';
}

export class AuthRenderer {
  constructor(controller) {
    this.controller = controller;
    this.bound = false;
    this.ensureViewportStyles();
  }

  ensureViewportStyles() {
    if (document.getElementById('miimiid-auth-engine-style')) return;
    const style = document.createElement('style');
    style.id = 'miimiid-auth-engine-style';
    style.textContent = `
      html.miimiid-auth-active,
      body.miimiid-auth-active { margin:0!important; padding:0!important; min-height:100%; overflow-x:hidden; }
      body.miimiid-auth-active { background:#0b1020!important; }
      #miimiid-auth-view.miimiid-auth-engine-owned { min-height:100dvh; width:100%; margin:0; padding:0; }
      .miimiid-auth-shell { min-height:100dvh; width:100%; display:flex; align-items:center; justify-content:center; padding:max(24px,env(safe-area-inset-top)) 20px max(24px,env(safe-area-inset-bottom)); background:#0b1020; }
      .miimiid-auth-panel { width:min(100%,460px); }
      .miimiid-auth-brand { margin:0 0 10px; font-size:32px; line-height:1; font-weight:800; letter-spacing:-.04em; color:#f8fafc; }
      .miimiid-auth-heading { margin:0; font-size:28px; line-height:1.15; color:#f8fafc; }
      .miimiid-auth-subheading { margin:10px 0 26px; color:#94a3b8; line-height:1.5; }
      .miimiid-auth-progress { display:flex; gap:6px; margin:0 0 22px; }
      .miimiid-auth-progress span { height:4px; flex:1; border-radius:999px; background:#263248; }
      .miimiid-auth-progress span.active { background:#38bdf8; }
      .miimiid-auth-form { display:grid; gap:16px; }
      .miimiid-auth-field { display:grid; gap:8px; }
      .miimiid-auth-field label { color:#e5e7eb; font-size:14px; font-weight:650; }
      .miimiid-auth-field input,.miimiid-auth-field select { width:100%; min-height:54px; padding:14px 15px; border:1px solid #334155; border-radius:14px; background:#111827; color:#f8fafc; outline:none; font:inherit; }
      .miimiid-auth-field input:focus,.miimiid-auth-field select:focus { border-color:#38bdf8; box-shadow:0 0 0 3px rgba(56,189,248,.12); }
      .miimiid-auth-field input[aria-invalid="true"],.miimiid-auth-field select[aria-invalid="true"] { border-color:#f87171; }
      .miimiid-auth-field-error { color:#fca5a5; font-size:13px; line-height:1.4; }
      .miimiid-auth-action { position:relative; width:100%; min-height:54px; border:0; border-radius:14px; background:#38bdf8; color:#07111f; font:inherit; font-weight:750; cursor:pointer; }
      .miimiid-auth-action:disabled { cursor:not-allowed; opacity:.72; }
      .miimiid-auth-action.loading .miimiid-auth-action-label { visibility:hidden; }
      .miimiid-auth-spinner { position:absolute; left:50%; top:50%; width:18px; height:18px; margin:-9px 0 0 -9px; border:2px solid currentColor; border-right-color:transparent; border-radius:50%; animation:miimiidAuthSpin .7s linear infinite; display:none; }
      .miimiid-auth-action.loading .miimiid-auth-spinner { display:block; }
      @keyframes miimiidAuthSpin { to { transform:rotate(360deg); } }
      .miimiid-auth-status { min-height:20px; margin-top:2px; color:#fca5a5; font-size:14px; line-height:1.4; }
      .miimiid-auth-status.success { color:#86efac; }
      .miimiid-auth-links { display:flex; flex-wrap:wrap; justify-content:center; gap:14px; margin-top:18px; }
      .miimiid-auth-link { border:0; background:none; color:#7dd3fc; font:inherit; cursor:pointer; padding:4px; }
      .miimiid-auth-back { color:#94a3b8; }
      .miimiid-auth-welcome { color:#cbd5e1; line-height:1.6; margin:0 0 24px; }
      .miimiid-auth-code { text-align:center; letter-spacing:.35em; font-size:22px!important; font-weight:700; }
    `;
    document.head.appendChild(style);
  }

  shell() {
    const root = document.getElementById('miimiid-auth-view');
    if (!root) throw new Error('Miimiid authentication viewport is missing.');
    root.classList.add('miimiid-auth-engine-owned');
    return root;
  }

  bind() {
    if (this.bound) return;
    const root = this.shell();
    root.addEventListener('input', (event) => {
      const field = event.target.closest('[data-auth-field]');
      if (field) this.controller.fieldChanged(field.dataset.authField, field.value);
    });
    root.addEventListener('change', (event) => {
      const field = event.target.closest('[data-auth-field]');
      if (field) this.controller.fieldChanged(field.dataset.authField, field.value);
    });
    root.addEventListener('focusin', (event) => {
      const field = event.target.closest('[data-auth-field]');
      if (field) this.controller.fieldFocused(field.dataset.authField);
    });
    root.addEventListener('focusout', (event) => {
      const field = event.target.closest('[data-auth-field]');
      if (field) this.controller.fieldBlurred(field.dataset.authField);
    });
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-auth-action]');
      if (!action) return;
      event.preventDefault();
      const actionId = action.dataset.authAction;
      if (actionId === 'switch-login') return this.controller.setFlow('login');
      if (actionId === 'switch-register') return this.controller.setFlow('register');
      if (actionId === 'switch-forgot') return this.controller.setFlow('forgot');
      if (actionId === 'back') return this.controller.back();
      if (actionId === 'primary') return this.controller.primaryAction();
      return this.controller.secondaryAction(actionId);
    });
    this.bound = true;
  }

  renderField(field, state) {
    const value = state.form.values[field.id] ?? '';
    const error = state.form.errors[field.id];
    const id = `miimiid-auth-field-${field.id}`;
    const label = escapeHtml(fieldLabel(field));

    if (field.type === 'select') {
      const options = (field.options || []).map(option => {
        const optionLabel = option === 'male' ? t('authMale', 'Male') : t('authFemale', 'Female');
        return `<option value="${escapeHtml(option)}" ${String(value) === option ? 'selected' : ''}>${escapeHtml(optionLabel)}</option>`;
      }).join('');
      return `<div class="miimiid-auth-field"><label for="${id}">${label}</label><select id="${id}" data-auth-field="${escapeHtml(field.id)}" aria-invalid="${Boolean(error)}"><option value="">${escapeHtml(t('authSelectGender','Select gender'))}</option>${options}</select>${error ? `<div class="miimiid-auth-field-error">${escapeHtml(t(error.code,'Please check this field.'))}</div>` : ''}</div>`;
    }

    const autocomplete = field.type === 'password' ? 'new-password' : field.type === 'email' ? 'email' : 'off';
    const classes = field.type === 'verification' ? 'miimiid-auth-code' : '';
    return `<div class="miimiid-auth-field"><label for="${id}">${label}</label><input id="${id}" class="${classes}" type="${inputType(field)}" value="${escapeHtml(value)}" autocomplete="${autocomplete}" data-auth-field="${escapeHtml(field.id)}" aria-invalid="${Boolean(error)}" ${field.type === 'verification' ? 'inputmode="numeric" maxlength="6"' : ''}>${error ? `<div class="miimiid-auth-field-error">${escapeHtml(t(error.code,'Please check this field.'))}</div>` : ''}</div>`;
  }

  renderProgress(state) {
    if (state.flow !== 'register') return '';
    const steps = ['welcome','name','email','birthday','password','verification'];
    const index = steps.indexOf(state.step);
    return `<div class="miimiid-auth-progress" aria-label="Registration progress">${steps.map((_, i) => `<span class="${i <= index ? 'active' : ''}"></span>`).join('')}</div>`;
  }

  renderLinks(state) {
    const links = [];
    if (state.flow === 'login') {
      links.push(`<button type="button" class="miimiid-auth-link" data-auth-action="switch-forgot">${escapeHtml(t('authForgotPassword','Forgot password?'))}</button>`);
      links.push(`<button type="button" class="miimiid-auth-link" data-auth-action="switch-register">${escapeHtml(t('authCreateAccountLink','Create an account'))}</button>`);
    } else if (state.flow === 'register' && state.step === 'welcome') {
      links.push(`<button type="button" class="miimiid-auth-link" data-auth-action="switch-login">${escapeHtml(t('authBackToSignIn','Back to sign in'))}</button>`);
    } else if (state.flow === 'forgot' || state.flow === 'reset') {
      links.push(`<button type="button" class="miimiid-auth-link" data-auth-action="switch-login">${escapeHtml(t('authBackToSignIn','Back to sign in'))}</button>`);
    }
    if (state.flow === 'register' && state.step !== 'welcome' && state.step !== 'verification') {
      links.unshift(`<button type="button" class="miimiid-auth-link miimiid-auth-back" data-auth-action="back">${escapeHtml(t('authBack','Back'))}</button>`);
    }
    return links.length ? `<div class="miimiid-auth-links">${links.join('')}</div>` : '';
  }

  render() {
    const state = this.controller.state;
    const step = this.controller.step;
    const root = this.shell();
    const meta = FLOW_LABELS[state.flow] || FLOW_LABELS.login;
    const title = step?.type === 'welcome' ? t('authCreateAccount','Create an account') : t(meta.title, 'Miimiid');
    const subtitle = step?.type === 'welcome' ? t('authCreateSubtitle','Create your Miimiid account to get started.') : t(meta.subtitle, '');
    const fields = (step?.fields || []).map(field => this.renderField(field, state)).join('');
    const isConfirmation = step?.type === 'confirmation';
    const isWelcome = step?.type === 'welcome';
    const action = step?.primaryAction;
    const loading = state.request.status === 'loading' && state.request.action === action?.id;
    const failure = state.error?.message || '';

    let content;
    if (isConfirmation) {
      const message = state.flow === 'forgot'
        ? t('authResetInstructionsSent','Reset instructions have been sent.')
        : state.flow === 'reset'
          ? t('authPasswordResetSuccess','Your password has been reset successfully.')
          : t('authAccountCreated','Your account is ready.');
      content = `<p class="miimiid-auth-welcome">${escapeHtml(message)}</p>`;
    } else if (isWelcome) {
      content = `<p class="miimiid-auth-welcome">${escapeHtml(subtitle)}</p>`;
    } else {
      content = fields;
    }

    const actionLabel = action ? t(action.label, action.id) : '';
    const actionButton = action ? `<button type="button" class="miimiid-auth-action ${loading ? 'loading' : ''}" data-auth-action="primary" ${loading ? 'disabled aria-busy="true"' : ''}><span class="miimiid-auth-action-label">${escapeHtml(actionLabel)}</span><span class="miimiid-auth-spinner" aria-hidden="true"></span></button>` : '';
    const statusClass = state.status === AUTH_STATUS.SUCCESS ? 'success' : '';

    root.innerHTML = `<main class="miimiid-auth-shell" aria-label="Miimiid authentication"><section class="miimiid-auth-panel"><div class="miimiid-auth-brand">Miimiid</div>${this.renderProgress(state)}<h1 class="miimiid-auth-heading">${escapeHtml(title)}</h1>${subtitle && !isWelcome ? `<p class="miimiid-auth-subheading">${escapeHtml(subtitle)}</p>` : ''}<form class="miimiid-auth-form" novalidate>${content}${actionButton}<div class="miimiid-auth-status ${statusClass}" role="alert">${escapeHtml(failure)}</div></form>${this.renderLinks(state)}</section></main>`;

    const focusId = step?.fields?.[0]?.id;
    if (focusId && state.status !== AUTH_STATUS.FAILURE && state.request.status !== 'loading') {
      const input = root.querySelector(`[data-auth-field="${CSS.escape(focusId)}"]`);
      if (input && document.activeElement === document.body) input.focus({ preventScroll: true });
    }
  }
}
