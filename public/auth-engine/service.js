export class AuthError extends Error {
  constructor({ type = 'authentication', code = 'AUTH_ERROR', field = null, message = 'Authentication request failed.', retryable = false, source = 'auth' } = {}) {
    super(message); this.name = 'AuthError';
    Object.assign(this, { type, code, field, retryable, source });
  }
}

export class AuthErrorNormalizer {
  normalize(error, response = null) {
    if (error?.name === 'AuthError') return error;
    if (error?.name === 'TypeError' || !response) return new AuthError({ type: 'network', code: 'NETWORK_ERROR', message: 'Unable to connect to the authentication service.', retryable: true, source: 'network' });
    return new AuthError({
      type: response.status >= 500 ? 'server' : 'authentication',
      code: error?.code || `HTTP_${response.status}`,
      field: error?.field || null,
      message: error?.message || 'Authentication request failed.',
      retryable: response.status >= 500,
      source: response.status >= 500 ? 'server' : 'api'
    });
  }
}

export class AuthService {
  constructor(normalizer = new AuthErrorNormalizer()) { this.normalizer = normalizer; }

  async request(endpoint, payload, method = 'POST') {
    let response;
    try {
      response = await fetch(endpoint, {
        method,
        credentials: 'same-origin',
        headers: { Accept: 'application/json', ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: payload === undefined ? undefined : JSON.stringify(payload)
      });
    } catch (error) { throw this.normalizer.normalize(error); }

    let result;
    try { result = await response.json(); }
    catch (error) { throw new AuthError({ type: 'server', code: 'INVALID_RESPONSE', message: 'The authentication service returned an invalid response.', source: 'server' }); }

    if (!response.ok || result?.status !== 'success') {
      throw this.normalizer.normalize({ code: result?.code, message: result?.message }, response);
    }
    return result;
  }

  register(v) { return this.request('/api/auth/register', { firstName: v.firstName, lastName: v.lastName, email: v.email, gender: v.gender, dateOfBirth: v.dateOfBirth, password: v.password }); }
  login(v) { return this.request('/api/auth/login', { identifier: v.email, password: v.password }); }
  verify(v) { return this.request('/api/auth/verify-account', { email: v.email, code: v.code }); }
  resendVerification(v) { return this.request('/api/auth/resend-verification', { email: v.email }); }
  forgotPassword(v) { return this.request('/api/auth/forgot-password', { email: v.email }); }
  resetPassword(v) { return this.request('/api/auth/reset-password', { token: new URLSearchParams(window.location.search).get('resetToken'), password: v.password }); }
  refreshSession() { return this.request('/api/auth/me', undefined, 'GET'); }
  logout() { return this.request('/api/auth/logout', {}); }
}

export class SessionManager {
  constructor(service) { this.service = service; this.status = 'unauthenticated'; this.user = null; }
  async restore() {
    this.status = 'refreshing';
    try { const result = await this.service.refreshSession(); this.user = result?.data?.user || null; this.status = this.user ? 'authenticated' : 'unauthenticated'; return this.user; }
    catch (_) { this.user = null; this.status = 'unauthenticated'; return null; }
  }
  setAuthenticated(user) { this.user = user || null; this.status = user ? 'authenticated' : 'unauthenticated'; }
  async logout() { await this.service.logout(); this.user = null; this.status = 'unauthenticated'; }
}
