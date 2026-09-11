import { AUTH_FLOW } from './config.js';
import { AUTH_STATUS, SESSION_STATUS, createAuthState, AuthStore } from './state.js';
import { FormEngine } from './form.js';
import { ValidationEngine } from './validation.js';
import { AuthService, SessionManager } from './service.js';

export class NavigationController {
  constructor(store, onTransition = () => {}) { this.store = store; this.onTransition = onTransition; }
  next(step) {
    const state = this.store.getState();
    this.store.patch({ ...state, navigation: { currentStep: step, history: [...state.navigation.history, state.step], transition: 'forward' }, step, status: AUTH_STATUS.IDLE, error: null });
    this.onTransition(step);
  }
  back(step) {
    const state = this.store.getState();
    this.store.patch({ ...state, navigation: { currentStep: step, history: state.navigation.history.slice(0, -1), transition: 'backward' }, step, status: AUTH_STATUS.IDLE, error: null });
    this.onTransition(step);
  }
}

export class ActionController {
  constructor(store, service, navigation, onRender, onSuccess) { this.store = store; this.service = service; this.navigation = navigation; this.onRender = onRender; this.onSuccess = onSuccess; this.running = false; }

  async execute(action, values) {
    if (!action || this.running) return null;
    this.running = true;
    this.store.patch(s => ({ ...s, status: AUTH_STATUS.SUBMITTING, request: { status: 'loading', action: action.id }, error: null }));
    this.onRender?.();
    try {
      const result = action.apiAction ? await this.service[action.apiAction](values) : null;
      this.store.patch(s => ({ ...s, status: AUTH_STATUS.SUCCESS, request: { status: 'success', action: action.id } }));
      this.onRender?.();
      this.onSuccess?.(action, result, values);
      if (action.nextStep && action.nextStep !== 'authenticated') this.navigation.next(action.nextStep);
      return result;
    } catch (error) {
      this.store.patch(s => ({ ...s, status: AUTH_STATUS.FAILURE, request: { status: 'failure', action: action.id }, error }));
      this.onRender?.();
      return false;
    } finally {
      this.running = false;
      if (this.store.getState().request.status === 'loading') this.store.patch(s => ({ ...s, request: { status: 'idle', action: null }, status: AUTH_STATUS.IDLE }));
      this.onRender?.();
    }
  }
}

export class AuthController {
  constructor({ flow = 'login', render = () => {}, onAuthenticated = () => {} } = {}) {
    if (!AUTH_FLOW[flow]) throw new Error(`Unknown auth flow: ${flow}`);
    this.store = new AuthStore(createAuthState(flow, AUTH_FLOW[flow].initial));
    this.form = new FormEngine();
    this.validation = new ValidationEngine();
    this.service = new AuthService();
    this.session = new SessionManager(this.service);
    this.render = render;
    this.onAuthenticated = onAuthenticated;
    this.navigation = new NavigationController(this.store, () => this.configureStep());
    this.actions = new ActionController(this.store, this.service, this.navigation, () => this.render(this), (action, result) => {
      if (action.nextStep === 'authenticated') {
        const user = result?.data?.user || result?.user || null;
        this.session.setAuthenticated(user);
        this.store.patch(s => ({ ...s, session: { status: SESSION_STATUS.AUTHENTICATED, user } }));
        this.onAuthenticated(user);
      }
    });
    this.configureStep();
  }

  get state() { return this.store.getState(); }
  get flow() { return AUTH_FLOW[this.state.flow]; }
  get step() { return this.flow.steps[this.state.step]; }

  configureStep() {
    const source = this.store.getState().form.values;
    this.form.configure(this.step?.fields || [], source);
    this.store.patch(s => ({
      ...s,
      form: {
        ...s.form,
        values: { ...s.form.values, ...this.form.values },
        touched: {},
        dirty: {},
        errors: {},
        fields: this.form.fields
      }
    }));
    this.render(this);
  }

  setFlow(flow) {
    if (!AUTH_FLOW[flow]) return;
    const session = this.store.getState().session;
    this.store.patch({ ...createAuthState(flow, AUTH_FLOW[flow].initial), session });
    this.configureStep();
  }

  fieldFocused(id) {
    this.form.setFocused(id, true);
    this.store.patch(s => ({ ...s, form: { ...s.form, fields: this.form.fields } }));
    this.render(this);
  }

  fieldBlurred(id) {
    this.form.setFocused(id, false);
    this.form.touch(id);
    this.store.patch(s => ({ ...s, form: { ...s.form, touched: { ...s.form.touched, [id]: true }, fields: this.form.fields } }));
    this.render(this);
  }

  fieldChanged(id, value) {
    this.form.setValue(id, value);
    const values = { ...this.store.getState().form.values, ...this.form.values };
    const errors = this.validation.validateStep(this.step, values);
    this.form.setErrors(errors);
    this.store.patch(s => ({
      ...s,
      status: AUTH_STATUS.IDLE,
      error: null,
      form: {
        ...s.form,
        values,
        touched: { ...s.form.touched, [id]: true },
        dirty: { ...s.form.dirty, [id]: true },
        errors,
        fields: this.form.fields
      }
    }));
    this.render(this);
  }

  get canContinue() {
    const state = this.state;
    return Boolean(this.step?.primaryAction) && state.request.status !== 'loading' && state.status !== AUTH_STATUS.SUBMITTING && state.status !== AUTH_STATUS.VALIDATING && this.form.canContinue;
  }

  async primaryAction() {
    if (this.actions.running || this.state.request.status === 'loading') return false;
    const fields = this.step?.fields || [];
    const values = { ...this.state.form.values, ...this.form.values };
    this.store.patch(s => ({ ...s, status: AUTH_STATUS.VALIDATING }));
    this.form.touchAll(fields);
    const errors = this.validation.validateStep(this.step, values);
    this.form.setErrors(errors);
    this.store.patch(s => ({ ...s, form: { ...s.form, touched: Object.fromEntries(fields.map(f => [f.id, true])), errors, fields: this.form.fields } }));
    if (Object.keys(errors).length) {
      this.store.patch(s => ({ ...s, status: AUTH_STATUS.FAILURE, error: null }));
      this.render(this);
      return false;
    }
    this.store.patch(s => ({ ...s, form: { ...s.form, errors: {} }, error: null }));
    this.render(this);
    const result = await this.actions.execute(this.step?.primaryAction, values);
    return result !== false;
  }

  async secondaryAction(id) {
    if (this.actions.running || this.state.request.status === 'loading') return false;
    const action = (this.step?.secondaryActions || []).find(x => x.id === id);
    if (!action) return false;
    const result = await this.actions.execute(action, { ...this.state.form.values, ...this.form.values });
    return result !== false;
  }

  back() {
    if (this.actions.running || this.state.request.status === 'loading') return false;
    const previous = this.step?.previousStep || this.state.navigation.history.at(-1);
    if (previous) this.navigation.back(previous);
    return true;
  }

  async restoreSession() {
    if (this.state.session.status === SESSION_STATUS.REFRESHING) return this.state.session.user;
    this.store.patch(s => ({ ...s, session: { ...s.session, status: SESSION_STATUS.REFRESHING } }));
    this.render(this);
    const user = await this.session.restore();
    this.store.patch(s => ({ ...s, session: { status: user ? SESSION_STATUS.AUTHENTICATED : SESSION_STATUS.UNAUTHENTICATED, user } }));
    this.render(this);
    return user;
  }
}
