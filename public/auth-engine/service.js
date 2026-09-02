import { SESSION_STATUS } from './state.js';

export class AuthService {
  async register(data) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Registration failed: ${res.statusText}`);
    return res.json();
  }

  async verifyAccount(data) {
    const res = await fetch('/api/auth/verify-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Verification failed: ${res.statusText}`);
    return res.json();
  }

  async resendVerification(data) {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Resend verification failed: ${res.statusText}`);
    return res.json();
  }

  async login(data) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
    return res.json();
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
  }

  async forgotPassword(data) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Forgot password failed: ${res.statusText}`);
    return res.json();
  }

  async resetPassword(data) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Reset password failed: ${res.statusText}`);
    return res.json();
  }

  async getMe() {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!res.ok) return null;
      return res.json();
    } catch (e) {
      console.error('Get authenticated user failed:', e);
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
      if (result && result.data && result.data.user) {
        this.setAuthenticated(result.data.user);
        return result.data.user;
      }
      return null;
    } catch (e) {
      console.error('Session restore failed:', e);
      return null;
    }
  }
}
