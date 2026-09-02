import { AUTH_STATUS } from './state.js';

const FORM_IDS = { login: 'miimiid-login-form', register: 'miimiid-register-form', forgot: 'miimiid-forgot-form', reset: 'miimiid-reset-form' };
const E = { welcome: { action: 'miimiid-register-get-started' }, login: { email: 'miimiid-login-identifier', password: 'miimiid-login-password', action: 'miimiid-login-submit' }, name: { firstName: 'miimiid-register-first-name', lastName: 'miimiid-register-last-name', action: 'miimiid-register-name-submit' }, email: { email: 'miimiid-register-email', action: 'miimiid-register-email-submit' }, birthday: { dob: 'miimiid-register-dob', action: 'miimiid-register-birthday-submit' }, password: { password: 'miimiid-register-password', confirmPassword: 'miimiid-register-confirm-password', action: 'miimiid-register-password-submit' }, verification: { code: 'miimiid-verification-code', action: 'miimiid-verification-submit', resend: 'miimiid-verification-resend' }, confirmation: {}, forgot: { email: 'miimiid-forgot-email', action: 'miimiid-forgot-submit' }, reset: { password: 'miimiid-reset-password', confirmPassword: 'miimiid-reset-confirm-password', action: 'miimiid-reset-submit' }, authenticated: {} };
function t(k, f) { try { const v = window.miimiidDashboardTranslate?.(k); if (v && v !== k) return v; } catch (_) {} return f || k; }

export class AuthRenderer {
  constructor(controller) { this.controller = controller; this.style(); }

  style() {
    if (document.getElementById('miimiid-auth-engine-style')) return;
    const s = document.createElement('style');
    s.id = 'miimiid-auth-engine-style';
    s.textContent = '.miimiid-auth-v5-loading{position:relative!important;pointer-events:none!important}.miimiid-auth-v5-loading .miimiid-auth-v5-label{visibility:hidden}.miimiid-auth-v5-spinner{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.miimiid-auth-v5-spinner::after{content:"";width:20px;height:20px;border:2px solid currentColor;border-radius:50%;border-top-color:transparent;animation:spin .6s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
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

  prepareSteps() {
    const f = document.getElementById(FORM_IDS.register);
    if (!f || f.querySelectorAll('[data-register-step]').length >= 6) return;
    [['miimiid-register-get-started'],['miimiid-register-first-name','miimiid-register-last-name'],['miimiid-register-email'],['miimiid-register-gender','miimiid-register-dob'],['miimiid-register-password','miimiid-register-confirm-password'],['miimiid-verification-code']].forEach((ids,i)=>{const s=f.querySelector(`[data-register-step="${i}"]`)||document.createElement('fieldset');s.dataset.registerStep=i;s.className='miimiid-auth-step';ids.forEach(id=>{const el=document.getElementById(id);if(el&&!el.closest('[data-register-step]'))s.appendChild(el)});if(!s.closest('form'))f.appendChild(s)});
  }

  bind() {
    this.prepareGender(); this.prepareSteps();
    const fields = new Map();
    Object.values(E).forEach(g => Object.entries(g).forEach(([k,id]) => { if (k !== 'action' && k !== 'resend') fields.set(id,k); }));
    fields.forEach((field,id)=>{const el=document.getElementById(id);if(!el||el.dataset.authEngineBound)return;el.dataset.authEngineBound='1';el.addEventListener('input',()=>this.controller.fieldChanged(field,el.value));el.addEventListener('focus',()=>this.controller.fieldFocused(field));el.addEventListener('blur',()=>this.controller.fieldBlurred(field))});
    Object.entries(E).forEach(([step,g])=>{if(!g.action)return;const b=document.getElementById(g.action);if(b&&!b.dataset.authEngineActionBound){b.dataset.authEngineActionBound='1';b.addEventListener('click',e=>{e.preventDefault();this.controller.primaryAction()})}});
    const r=document.getElementById(E.verification.resend);if(r&&!r.dataset.authEngineActionBound){r.dataset.authEngineActionBound='1';r.addEventListener('click',e=>{e.preventDefault();this.controller.secondaryAction('resend')})}
    Object.entries({'miimiid-show-register':'register','miimiid-show-forgot':'forgot','miimiid-show-login-from-register':'login','miimiid-show-login-from-forgot':'login','miimiid-show-login-from-reset':'login'}).forEach(([id,flow])=>{const b=document.getElementById(id);if(b&&!b.dataset.authEngineFlowBound){b.dataset.authEngineFlowBound='1';b.addEventListener('click',e=>{e.preventDefault();this.controller.setFlow(flow)})}});
  }

  button(action,step) {
    const b=document.getElementById(E[step]?.action); if(!b)return;
    const loading=this.controller.state.request.status==='loading'&&this.controller.state.request.action===action.id;
    const disabled=loading||this.controller.state.status===AUTH_STATUS.VALIDATING;
    if(!b.querySelector('.miimiid-auth-v5-spinner')){const h=b.innerHTML;b.innerHTML=`<span class="miimiid-auth-v5-label">${h}</span><span class="miimiid-auth-v5-spinner" aria-hidden="true"></span>`}
    b.disabled=disabled;b.setAttribute('aria-busy',String(loading));b.classList.toggle('miimiid-auth-v5-loading',loading);b.querySelector('.miimiid-auth-v5-spinner').style.display=loading?'block':'none';
  }

  errors() {
    for(const f of this.controller.step?.fields||[]){const el=document.getElementById(E[this.controller.state.step]?.[f.id]||'');if(!el)continue;const er=this.controller.state.form.errors[f.id];el.classList.toggle('miimiid-auth-field-error',!!er);el.setAttribute('aria-invalid',String(!!er))}
  }

  render(){const s=this.controller.state;this.prepareGender();this.prepareSteps();Object.entries(FORM_IDS).forEach(([m,id])=>document.getElementById(id)?.classList.toggle('hidden',m!==s.flow));if(s.step==='authenticated')return;this.button(this.controller.step?.primaryAction,s.step);this.errors()}
}
