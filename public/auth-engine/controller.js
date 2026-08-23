import { AUTH_FLOW } from './config.js';
import { AUTH_STATUS, SESSION_STATUS, createAuthState, AuthStore } from './state.js';
import { FormEngine } from './form.js';
import { ValidationEngine } from './validation.js';
import { AuthService, SessionManager } from './service.js';

export class NavigationController {
  constructor(store) { this.store = store; }
  next(step) { const state = this.store.getState(); this.store.patch({ ...state, navigation: { currentStep: step, history: [...state.navigation.history, state.step], transition: 'forward' }, step, status: AUTH_STATUS.IDLE, error: null }); }
  back(step) { const state = this.store.getState(); this.store.patch({ ...state, navigation: { currentStep: step, history: state.navigation.history.slice(0, -1), transition: 'backward' }, step, status: AUTH_STATUS.IDLE, error: null }); }
}

export class ActionController {
  constructor(store, service, navigation, onRender) { this.store = store; this.service = service; this.navigation = navigation; this.onRender = onRender; this.running = false; }

  async execute(action, values) {
    if (this.running) return;
    this.running = true;
    this.store.patch(state => ({ ...state, status: AUTH_STATUS.SUBMITTING, request: { status: 'loading', action: action.id }, error: null }));
    this.onRender?.();
    try {
      const result = action.apiAction ? await this.service[action.apiAction](values) : null;
      this.store.patch(state => ({ ...state, status: AUTH_STATUS.SUCCESS, request: { status: 'success', action: action.id } }));
      this.onRender?.();
      if (action.apiAction === 'register') {
        const email = values.email;
        this.store.patch(state => ({ ...state, form: { ...state.form, values: { ...state.form.values, email } } }));
      }
      if (action.nextStep) this.navigation.next(action.nextStep);
      return result;
    } catch (error) {
      this.store.patch(state => ({ ...state, status: AUTH_STATUS.FAILURE, request: { status: 'failure', action: action.id }, error }));
      this.onRender?.();
      throw error;
    } finally {
      this.running = false;
      if (this.store.getState().request.status === 'loading') this.store.patch(state => ({ ...state, request: { status: 'idle', action: null }, status: AUTH_STATUS.IDLE }));
      this.onRender?.();
    }
  }
}

export class AuthController {
  constructor({ flow = 'login', render = () => {} } = {}) {
    const initial = AUTH_FLOW[flow].initial;
    this.store = new AuthStore(createAuthState(flow, initial));
    this.form = new FormEngine();
    this.validation = new ValidationEngine();
    this.service = new AuthService();
    this.session = new SessionManager(this.service);
    this.navigation = new NavigationController(this.store);
    this.render = render;
    this.actions = new ActionController(this.store, this.service, this.navigation, () => this.render(this));
    this.configureStep();
  }

  get state() { return this.store.getState(); }
  get flow() { return AUTH_FLOW[this.state.flow]; }
  get step() { return this.flow.steps[this.state.step]; }

  configureStep() {
    const old = this.form.values;
    this.form.configure(this.step?.fields || [], old);
    this.store.patch(state => ({ ...state, form: { ...state.form, values: { ...state.form.values, ...this.form.values }, errors: {} } }));
    this.render(this);
  }

  setFlow(flow) {
    if (!AUTH_FLOW[flow]) return;
    this.store.patch(state => ({ ...createAuthState(flow, AUTH_FLOW[flow].initial), session: state.session }));
    this.configureStep();
  }

  fieldChanged(id, value) {
    this.form.setValue(id, value);
    const values = { ...this.store.getState().form.values, ...this.form.values };
    const errors = this.validation.validateStep(this.step, values);
    this.form.setErrors(errors);
    this.store.patch(state => ({ ...state, status: AUTH_STATUS.IDLE, form: { ...state.form, values, touched: { ...state.form.touched, [id]: true }, dirty: { ...state.form.dirty, [id]: true }, errors } }));
    this.render(this);
  }

  async primaryAction() {
    if (this.actions.running) return;
    const fields = this.step?.fields || [];
    const values = { ...this.store.getState().form.values, ...this.form.values };
    const errors = this.validation.validateStep(this.step, values);
    this.form.touchAll(fields);
    this.form.setErrors(errors);
    if (Object.keys(errors).length) {
      this.store.patch(state => ({ ...state, status: AUTH_STATUS.FAILURE, form: { ...state.form, touched: Object.fromEntries(fields.map(f => [f.id, true])), errors }, error: null }));
      this.render(this);
      return false;
    }
    this.store.patch(state => ({ ...state, status: AUTH_STATUS.VALIDATING, form: { ...state.form, errors: {} } }));
    this.render(this);
    await Promise.resolve();
    const action = this.step?.primaryAction;
    try { await this.actions.execute(action, values); }
    catch (_) { return false; }
    return true;
  }

  back() {
    const previous = this.step?.previousStep || this.state.navigation.history.at(-1);
    if (previous) { this.navigation.back(previous); this.configureStep(); }
  }

  async restoreSession() {
    this.store.patch(state => ({ ...state, session: { ...state.session, status: SESSION_STATUS.REFRESHING } }));
    const user = await this.session.restore();
    this.store.patch(state => ({ ...state, session: { status: user ? SESSION_STATUS.AUTHENTICATED : SESSION_STATUS.UNAUTHENTICATED, user } }));
    return user;
  }
}
