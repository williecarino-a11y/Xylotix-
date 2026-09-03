import { SESSION_STATUS } from './state.js';

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}.`
    );
    error.code = payload?.code || `HTTP_${response.status}`;
    error.status = response.status;
    error.data = payload?.data;
    throw error;
  }

  return payload;
}

function post(url, data) {
  return request(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export class AuthService {
  async register(data) {
    return post('/api/auth/register', data);
  }

  async verifyAccount(data) {
    return post('/api/auth/verify-account', data);
  }

  async resendVerification(data) {
    return post('/api/auth/resend-verification', data);
  }

  async login(data) {
    return post('/api/auth/login', data);
  }

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async forgotPassword(data) {
    return post('/api/auth/forgot-password', data);
  }

  async resetPassword(data) {
    return post('/api/auth/reset-password', data);
  }

  async getMe() {
    try {
      return await request('/api/auth/me', { method: 'GET' });
    } catch (error) {
      if (error.status === 401) return null;
      console.error('Get authenticated user failed:', error);
      return null;
    }
  }
}

export class SessionManager {
  constructor(service) {
    this.service = service;
    this.authenticated = false;
    this.user = null;
  }

  setAuthenticated(user) {
    this.authenticated = !!user;
    this.user = user || null;
  }

  async restore() {
    try {
      const result = await this.service.getMe();
      if (result?.data?.user) {
        this.setAuthenticated(result.data.user);
        return result.data.user;
      }
      this.setAuthenticated(null);
      return null;
    } catch (error) {
      console.error('Session restore failed:', error);
      this.setAuthenticated(null);
      return null;
    }
  }
}
