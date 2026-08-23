export const AUTH_STATUS = Object.freeze({
  IDLE: 'idle',
  VALIDATING: 'validating',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  FAILURE: 'failure',
  RECOVERING: 'recovering'
});

export const SESSION_STATUS = Object.freeze({
  UNAUTHENTICATED: 'unauthenticated',
  AUTHENTICATING: 'authenticating',
  AUTHENTICATED: 'authenticated',
  REFRESHING: 'refreshing',
  EXPIRED: 'expired'
});

export function createAuthState(flow, step) {
  return {
    flow,
    step,
    status: AUTH_STATUS.IDLE,
    error: null,
    request: { status: 'idle', action: null },
    form: {
      values: {},
      touched: {},
      dirty: {},
      errors: {},
      fields: {}
    },
    navigation: { currentStep: step, history: [], transition: 'idle' },
    session: { status: SESSION_STATUS.UNAUTHENTICATED, user: null }
  };
}

export class AuthStore {
  constructor(initialState) {
    this.state = structuredClone(initialState);
    this.listeners = new Set();
  }

  getState() { return this.state; }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  patch(updater) {
    const next = typeof updater === 'function' ? updater(this.state) : { ...this.state, ...updater };
    this.state = next;
    this.listeners.forEach(listener => listener(this.state));
    return this.state;
  }

  transition(status, patch = {}) {
    return this.patch(state => ({ ...state, status, ...patch }));
  }
}
