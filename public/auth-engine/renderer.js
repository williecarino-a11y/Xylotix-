import { AUTH_FLOW, AUTH_MODE_ACTIONS } from './config.js';

export class AuthRenderer {
  constructor(controller) {
    this.controller = controller;
  }

  bind() {
    const form = this.getForm();
    if (!form) return;

    form.addEventListener('input', (e) => {
      if (e.target.name) {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.controller.fieldChanged(e.target.name, value);
      }
    });

    form.addEventListener('focus', (e) => {
      if (e.target.name) this.controller.fieldFocused(e.target.name);
    }, true);

    form.addEventListener('blur', (e) => {
      if (e.target.name) this.controller.fieldBlurred(e.target.name);
    }, true);

    const stepContainer = form.querySelector('[data-auth-step]');
    if (stepContainer) {
      const step = this.controller.state.step;
      const buttons = stepContainer.querySelectorAll('button');
      buttons.forEach((btn) => {
        if (btn.dataset.action === 'primary' && step?.primaryAction) {
          btn.addEventListener('click', () => this.controller.primaryAction());
        } else if (btn.dataset.action === 'secondary') {
          const actionId = btn.id.replace(/^miimiid-/, '').replace(/-action$/, '');
          btn.addEventListener('click', () => this.controller.secondaryAction(actionId));
        }
      });
    }

    const modeButtons = document.querySelectorAll('.miimiid-auth-mode');
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const flow = e.target.dataset.flow || (e.target.id.includes('login') ? 'login' : e.target.id.includes('register') ? 'register' : 'login');
        this.controller.setFlow(flow);
      });
    });
  }

  getForm() {
    const flowName = this.controller.state.flow;
    return document.getElementById(`miimiid-${flowName}-form`);
  }

  render() {
    const state = this.controller.state;
    const form = this.getForm();
    if (!form) return;

    const currentStep = form.querySelector(`[data-auth-step="${state.step}"]`);
    form.querySelectorAll('[data-auth-step]').forEach((step) => {
      step.style.display = step === currentStep ? 'block' : 'none';
    });

    if (currentStep) {
      const statusEl = currentStep.querySelector('.miimiid-auth-status');
      if (statusEl) {
        statusEl.textContent = '';
        if (state.error) {
          statusEl.textContent = typeof state.error === 'string' ? state.error : state.error.message || 'An error occurred';
          statusEl.className = 'miimiid-auth-status error';
        }
      }

      const fields = currentStep.querySelectorAll('input, select, textarea');
      fields.forEach((field) => {
        const id = field.name;
        const fieldState = state.form.fields[id];
        if (fieldState) {
          field.value = fieldState.value || '';
          const errorEl = field.parentElement?.querySelector('.error-message');
          if (errorEl) {
            errorEl.textContent = state.form.errors[id] || '';
            errorEl.style.display = state.form.errors[id] ? 'block' : 'none';
          }
        }
      });

      const primaryBtn = currentStep.querySelector('[data-action="primary"]');
      if (primaryBtn) {
        primaryBtn.disabled = !this.controller.canContinue || state.status === 'submitting';
        primaryBtn.textContent = state.request.status === 'loading' ? 'Loading...' : 'Continue';
      }
    }
  }
}
