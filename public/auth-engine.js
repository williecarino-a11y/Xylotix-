(function () {
  'use strict';

  const LABELS = {
    login: 'Sign in', register: 'Create account', forgot: 'Forgot password', reset: 'Reset password',
    welcome: 'Welcome to Miimiid', name: 'Your name', email: 'Your email', birthday: 'Your details',
    password: 'Create your password', verification: 'Verify your email', confirmation: 'Done',
    firstName: 'First name', lastName: 'Last name', confirmPassword: 'Confirm password',
    gender: 'Gender', dateOfBirth: 'Birthday', code: 'Verification code', male: 'Male', female: 'Female',
    authContinue: 'Continue', authGetStarted: 'Get started', authSignIn: 'Sign in',
    authCreateAccountButton: 'Create account', authVerifyAccount: 'Verify', authResendCode: 'Resend code',
    authSendResetInstructions: 'Send reset instructions', authResetPasswordButton: 'Reset password'
  };

  function text(key) {
    return LABELS[key] || key;
  }

  function createAuthShell() {
    const existingAuthView = document.getElementById('miimiid-auth-view');
    if (existingAuthView) {
      if (existingAuthView.querySelector('#miimiid-auth-content')) return;
      existingAuthView.remove();
    }

    const auth = document.createElement('main');
    auth.id = 'miimiid-auth-view';
    auth.className = 'miimiid-auth-shell';
    auth.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;';
    auth.setAttribute('aria-label', 'Authentication');
    
    auth.innerHTML = `
      <div style="width:100%;max-width:400px;padding:20px;border:1px solid #334155;border-radius:12px;background:#1e293b;">
        <div style="margin-bottom:24px;">
          <h1 style="margin:0;color:#38bdf8;font-size:28px;text-align:center;">${text('login')}</h1>
        </div>
        <form id="miimiid-login-form" style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <label for="email" style="display:block;margin-bottom:6px;color:#f8fafc;font-weight:600;">Email</label>
            <input type="email" id="email" name="email" required style="width:100%;padding:10px;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:6px;font-size:14px;box-sizing:border-box;">
          </div>
          <div>
            <label for="password" style="display:block;margin-bottom:6px;color:#f8fafc;font-weight:600;">Password</label>
            <input type="password" id="password" name="password" required style="width:100%;padding:10px;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:6px;font-size:14px;box-sizing:border-box;">
          </div>
          <button type="submit" style="width:100%;padding:12px;background:#0284c7;color:white;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin-top:12px;">Sign In</button>
        </form>
        <div id="auth-error" style="display:none;margin-top:12px;padding:12px;background:#450a0a;border:1px solid #7f1d1d;color:#f87171;border-radius:6px;"></div>
      </div>
    `;

    document.body.innerHTML = '';
    document.body.appendChild(auth);

    // Handle login form submission
    const form = document.getElementById('miimiid-login-form');
    const errorEl = document.getElementById('auth-error');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: email, password }),
          credentials: 'include'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data.user) {
            window.location.reload();
          }
        } else {
          const error = await res.json();
          errorEl.style.display = 'block';
          errorEl.textContent = error.message || 'Login failed';
        }
      } catch (err) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Network error: ' + err.message;
      }
    });
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createAuthShell);
    } else {
      createAuthShell();
    }
  }

  boot();
})();
