import { AUTH_STATUS } from './state.js';

const FORM_IDS = { login: 'miimiid-login-form', register: 'miimiid-register-form', forgot: 'miimiid-forgot-form', reset: 'miimiid-reset-form' };
const E = {
  welcome: { action: 'miimiid-register-get-started' },
  login: { email: 'miimiid-login-identifier', password: 'miimiid-login-password', action: 'miimiid-login-submit' },
  name: { firstName: 'miimiid-register-first-name', lastName: 'miimiid-register-last-name', action: 'miimiid-register-name-next' },
  email: { email: 'miimiid-register-email', action: 'miimiid-register-contact-next' },
  birthday: { gender: 'miimiid-register-gender', dob: 'miimiid-register-dob', action: 'miimiid-register-details-next' },
  password: { password: 'miimiid-register-password', confirmPassword: 'miimiid-register-confirm', action: 'miimiid-register-submit' },
  verification: { code: 'miimiid-register-verification-code', action: 'miimiid-verify-account-submit', resend: 'miimiid-resend-verification' },
  confirmation: {},
  forgot: { email: 'miimiid-forgot-identifier', action: 'miimiid-forgot-submit' },
  reset: { password: 'miimiid-reset-password', confirmPassword: 'miimiid-reset-confirm', action: 'miimiid-reset-submit' },
  authenticated: {}
};

const REGISTER_STEPS = [
  ['miimiid-register-get-started'],
  ['miimiid-register-first-name', 'miimiid-register-last-name'],
  ['miimiid-register-email'],
  ['miimiid-register-gender', 'miimiid-register-dob'],
  ['miimiid-register-password', 'miimiid-register-confirm'],
  ['miimiid-register-verification-code']
];

const REGISTER_ACTIONS = [
  'miimiid-register-get-started',
  'miimiid-register-name-next',
  'miimiid-register-contact-next',
  'miimiid-register-details-next',
  'miimiid-register-submit',
  'miimiid-verify-account-submit'
];

function t(k, f) { try { const v = window.miimiidDashboardTranslate?.(k); if (v && v !== k) return v; } catch (_) {} return f || k; }

export class AuthRenderer {
  constructor(controller) { this.controller = controller; this.style(); }

  style() {
    if (document.getElementById('miimiid-auth-engine-style')) return;
    const s = document.createElement('style');
    s.id = 'miimiid-auth-engine-style';
    s.textContent = '.miimiid-auth-v5-loading{position:relative!important;pointer-events:none!important}.miimiid-auth-v5-loading .miimiid-auth-v5-label{visibility:hidden}.miimiid-auth-v5-spinner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.miimiid-auth-v5-spinner .continue-loading-arc{width:20px;height:20px}.miimiid-auth-logo{display:grid!important;place-items:center!important;width:56px!important;height:56px!important;padding:0!important;overflow:hidden!important;border-radius:16px!important;background:transparent!important}.miimiid-auth-logo img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}.miimiid-auth-step{border:0!important;margin:0!important;padding:0!important;min-width:0!important}.miimiid-auth-step[hidden]{display:none!important}';
    document.head.appendChild(s);
  }

  installLogo() {
    const logo = document.querySelector('.miimiid-auth-logo');
    if (!logo || logo.dataset.miimiidLogo === 'true') return;
    const img = document.createElement('img');
    img.src = '/icons/icon-512.svg';
    img.alt = 'Miimiid';
    img.width = 56;
    img.height = 56;
    img.loading = 'eager';
    img.decoding = 'async';
    logo.replaceChildren(img);
    logo.setAttribute('aria-label', 'Miimiid logo');
    logo.dataset.miimiidLogo = 'true';
  }

  prepareGender() {
    if (document.getElementById('miimiid-register-gender')) return;
    const dob = document.getElementById('miimiid-register-dob');
    if (!dob) return;
    const p = dob.closest('.miimiid-auth-field') || dob.parentElement;
    const w = document.createElement('div');
    w.className = p?.className || 'miimiid-auth-field';
    w.innerHTML = `<label for="miimiid-register-gender">${t('authGender','Gender')}</label><select id="miimiid-register-gender"><option value="">${t('authSelectGender','Select gender')}</option><option value="male">${t('authMale','Male')}</option><option value="female">${t('authFemale','Female')}</option></select>`;
    (p?.parentElement || dob.parentElement).insertBefore(w, p || dob);
  }

  findStepContainer(form, index) {
    return form.querySelector(`[data-register-step="${index}"]`);
  }

  createStepContainer(form, index) {
    const step = document.createElement('fieldset');
    step.className = 'miimiid-auth-step';
    step.dataset.registerStep = String(index);
    step.hidden = true;
    return step;
  }

  prepareSteps() {
    const form = document.getElementById(FORM_IDS.register);
    if (!form) return;

    const authored = Array.from(form.querySelectorAll('[data-register-step]'));
    if (authored.length >= REGISTER_STEPS.length) return;

    const containers = Array.from({ length: REGISTER_STEPS.length }, (_, index) => {
      return this.findStepContainer(form, index) || this.createStepContainer(form, index);
    });

    containers.forEach((step, index) => {
      if (!step.parentElement) form.appendChild(step);
      step.dataset.registerStep = String(index);
      step.classList.add('miimiid-auth-step');

      REGISTER_STEPS[index].forEach(id => {
        const el = document.getElementById(id);
        if (!el || step.contains(el)) return;
        const wrapper = el.closest('.miimiid-auth-field');
        if (wrapper && wrapper.closest('form') === form && !wrapper.closest('[data-register-step]')) {
          step.appendChild(wrapper);
        } else if (el.closest('form') === form && !el.closest('[data-register-step]')) {
          step.appendChild(el);
        }
      });

      const actionId = REGISTER_ACTIONS[index];
      const action = document.getElementById(actionId);
      if (action && !step.contains(action)) {
        const actions = action.closest('.miimiid-auth-actions');
        if (actions && actions.closest('form') === form && !actions.closest('[data-register-step]')) step.appendChild(actions);
        else if (action.closest('form') === form && !action.closest('[data-register-step]')) step.appendChild(action);
      }
    });
  }

  syncRegistrationSteps() {
    const form = document.getElementById(FORM_IDS.register);
    if (!form) return;
    const stepIndex = ['welcome', 'name', 'email', 'birthday', 'password', 'verification'].indexOf(this.controller.state.step);
    const containers = Array.from(form.querySelectorAll('[data-register-step]'));
    containers.forEach((container, index) => {
      const visible = index === stepIndex;
      container.hidden = !visible;
      container.setAttribute('aria-hidden', String(!visible));
    });
  }

  bind() {
    this.prepareGender();
    this.prepareSteps();
    this.installLogo();
    this.syncRegistrationSteps();
    const fields = new Map();
    Object.values(E).forEach(g => Object.entries(g).forEach(([k,id]) => { if (k !== 'action' && k !== 'resend') fields.set(id,k); }));
    fields.forEach((field,id)=>{const el=document.getElementById(id);if(!el||el.dataset.authEngineBound)return;el.dataset.authEngineBound='1';el.addEventListener('input',()=>this.controller.fieldChanged(field,el.value));el.addEventListener('focus',()=>this.controller.fieldFocused(field));el.addEventListener('blur',()=>this.controller.fieldBlurred(field));});
    Object.entries(E).forEach(([step,g])=>{if(!g.action)return;const b=document.getElementById(g.action);if(b&&!b.dataset.authEngineActionBound){b.dataset.authEngineActionBound='1';b.addEventListener('click',e=>{e.preventDefault();this.controller.primaryAction();});}});
    const r=document.getElementById(E.verification.resend);if(r&&!r.dataset.authEngineActionBound){r.dataset.authEngineActionBound='1';r.addEventListener('click',e=>{e.preventDefault();this.controller.secondaryAction('resend');});}
    Object.entries({'miimiid-show-register':'register','miimiid-show-forgot':'forgot','miimiid-show-login-from-register':'login','miimiid-show-login-from-forgot':'login','miimiid-show-login-from-reset':'login'}).forEach(([id,flow])=>{const b=document.getElementById(id);if(b&&!b.dataset.authEngineFlowBound){b.dataset.authEngineFlowBound='1';b.addEventListener('click',e=>{e.preventDefault();this.controller.setFlow(flow);});}});
  }

  button(action,step) {
    const b=document.getElementById(E[step]?.action); if(!b)return;
    const loading=this.controller.state.request.status==='loading'&&this.controller.state.request.action===action?.id;
    const disabled=loading||this.controller.state.status===AUTH_STATUS.VALIDATING||this.controller.actions?.running;
    if(!b.querySelector('.miimiid-auth-v5-spinner')){
      const h=b.innerHTML;
      b.innerHTML=`<span class="miimiid-auth-v5-label">${h}</span><span class="miimiid-auth-v5-spinner" aria-hidden="true"><span class="continue-loading-arc"></span></span>`;
    }
    b.disabled=Boolean(disabled);
    b.setAttribute('aria-busy',String(loading));
    b.classList.toggle('miimiid-auth-v5-loading',loading);
    const spinner=b.querySelector('.miimiid-auth-v5-spinner');
    if(spinner) spinner.style.display=loading?'flex':'none';
  }

  errors() {
    for(const f of this.controller.step?.fields||[]){const el=document.getElementById(E[this.controller.state.step]?.[f.id]||'');if(!el)continue;const er=this.controller.state.form.errors[f.id];el.classList.toggle('miimiid-auth-field-error',!!er);el.setAttribute('aria-invalid',String(!!er));}
  }

  render(){
    const s=this.controller.state;
    this.prepareGender();
    this.prepareSteps();
    this.installLogo();
    Object.entries(FORM_IDS).forEach(([m,id])=>document.getElementById(id)?.classList.toggle('hidden',m!==s.flow));
    if(s.flow==='register') this.syncRegistrationSteps();
    if(s.step==='authenticated') return;
    this.button(this.controller.step?.primaryAction,s.step);
    this.errors();
  }
}
