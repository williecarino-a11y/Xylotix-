(function () {
  'use strict';

  const AUTH_ROOT_ID = 'miimiid-auth-view';
  const styleId = 'miimiid-production-auth-style';

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function injectStyles() {
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      :root {
        --auth-bg: #07111f;
        --auth-panel: rgba(15, 27, 45, 0.92);
        --auth-panel-2: #0d1b2d;
        --auth-border: rgba(148, 163, 184, 0.18);
        --auth-text: #f8fafc;
        --auth-muted: #94a3b8;
        --auth-primary: #38bdf8;
        --auth-primary-strong: #0284c7;
        --auth-danger: #f87171;
        --auth-success: #4ade80;
        --auth-focus: rgba(56, 189, 248, 0.28);
      }

      .miimiid-auth-page {
        min-height: 100vh;
        min-height: 100svh;
        display: grid;
        place-items: center;
        position: relative;
        overflow: hidden;
        padding: 28px 18px;
        color: var(--auth-text);
        background:
          radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.14), transparent 32%),
          radial-gradient(circle at 85% 85%, rgba(37, 99, 235, 0.13), transparent 30%),
          var(--auth-bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .miimiid-auth-page::before,
      .miimiid-auth-page::after {
        content: "";
        position: absolute;
        border-radius: 999px;
        filter: blur(1px);
        pointer-events: none;
      }

      .miimiid-auth-page::before {
        width: 420px;
        height: 420px;
        top: -250px;
        right: -170px;
        border: 1px solid rgba(56, 189, 248, 0.12);
      }

      .miimiid-auth-page::after {
        width: 360px;
        height: 360px;
        bottom: -240px;
        left: -160px;
        border: 1px solid rgba(59, 130, 246, 0.1);
      }

      .miimiid-auth-card {
        width: min(100%, 470px);
        position: relative;
        z-index: 1;
        padding: 30px;
        border: 1px solid var(--auth-border);
        border-radius: 24px;
        background: var(--auth-panel);
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(18px);
      }

      .miimiid-auth-brand {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 24px;
      }

      .miimiid-auth-logo {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 13px;
        color: #e0f2fe;
        background: linear-gradient(145deg, #0284c7, #2563eb);
        box-shadow: 0 10px 25px rgba(2, 132, 199, 0.28);
        font-weight: 900;
        letter-spacing: -0.04em;
      }

      .miimiid-auth-brand-name {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 850;
        letter-spacing: -0.03em;
      }

      .miimiid-auth-heading {
        margin: 0;
        text-align: center;
        font-size: clamp(1.65rem, 5vw, 2rem);
        line-height: 1.15;
        letter-spacing: -0.035em;
      }

      .miimiid-auth-subtitle {
        margin: 10px auto 24px;
        max-width: 360px;
        text-align: center;
        color: var(--auth-muted);
        line-height: 1.55;
        font-size: 0.94rem;
      }

      .miimiid-auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        padding: 4px;
        margin-bottom: 22px;
        border: 1px solid var(--auth-border);
        border-radius: 13px;
        background: rgba(2, 6, 23, 0.35);
      }

      .miimiid-auth-tab {
        min-height: 42px;
        border: 0;
        border-radius: 9px;
        color: var(--auth-muted);
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-weight: 750;
        transition: 0.18s ease;
      }

      .miimiid-auth-tab:hover { color: var(--auth-text); }
      .miimiid-auth-tab.active {
        color: #e0f2fe;
        background: #15324b;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
      }

      .miimiid-auth-form { display: grid; gap: 16px; }
      .miimiid-auth-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .miimiid-auth-field { display: grid; gap: 7px; }

      .miimiid-auth-label {
        color: #e2e8f0;
        font-size: 0.86rem;
        font-weight: 700;
      }

      .miimiid-auth-required { color: var(--auth-primary); }

      .miimiid-auth-input-wrap { position: relative; }

      .miimiid-auth-input,
      .miimiid-auth-select {
        width: 100%;
        min-height: 48px;
        padding: 12px 14px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 11px;
        outline: none;
        color: var(--auth-text);
        background: #091727;
        font: inherit;
        font-size: 0.94rem;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      }

      .miimiid-auth-input[type="password"] { padding-right: 88px; }
      .miimiid-auth-input::placeholder { color: #64748b; }
      .miimiid-auth-select option { background: #091727; color: var(--auth-text); }

      .miimiid-auth-input:hover,
      .miimiid-auth-select:hover { border-color: rgba(148, 163, 184, 0.34); }

      .miimiid-auth-input:focus,
      .miimiid-auth-select:focus {
        border-color: var(--auth-primary);
        box-shadow: 0 0 0 4px var(--auth-focus);
        background: #0b1b2d;
      }

      .miimiid-auth-input[aria-invalid="true"],
      .miimiid-auth-select[aria-invalid="true"] {
        border-color: rgba(248, 113, 113, 0.75);
      }

      .miimiid-auth-password-toggle {
        position: absolute;
        top: 50%;
        right: 8px;
        transform: translateY(-50%);
        min-height: 34px;
        padding: 0 9px;
        border: 0;
        border-radius: 8px;
        color: #bae6fd;
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-size: 0.78rem;
        font-weight: 750;
      }

      .miimiid-auth-password-toggle:hover,
      .miimiid-auth-password-toggle:focus-visible { background: rgba(56, 189, 248, 0.1); outline: none; }

      .miimiid-auth-help {
        min-height: 18px;
        margin: 0;
        color: var(--auth-muted);
        font-size: 0.76rem;
        line-height: 1.45;
      }

      .miimiid-auth-message {
        display: none;
        padding: 12px 13px;
        border-radius: 11px;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .miimiid-auth-message.show { display: block; }
      .miimiid-auth-message.error { color: #fecaca; background: rgba(127, 29, 29, 0.28); border: 1px solid rgba(248, 113, 113, 0.25); }
      .miimiid-auth-message.success { color: #bbf7d0; background: rgba(20, 83, 45, 0.25); border: 1px solid rgba(74, 222, 128, 0.25); }

      .miimiid-auth-submit {
        width: 100%;
        min-height: 50px;
        margin-top: 2px;
        border: 0;
        border-radius: 11px;
        color: white;
        background: linear-gradient(135deg, #0284c7, #2563eb);
        box-shadow: 0 12px 26px rgba(2, 132, 199, 0.22);
        cursor: pointer;
        font: inherit;
        font-weight: 800;
        transition: transform 0.16s ease, filter 0.16s ease, opacity 0.16s ease;
      }

      .miimiid-auth-submit:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
      .miimiid-auth-submit:active:not(:disabled) { transform: translateY(0); }
      .miimiid-auth-submit:disabled { opacity: 0.62; cursor: not-allowed; }

      .miimiid-auth-footer {
        margin: 20px 0 0;
        color: #64748b;
        text-align: center;
        font-size: 0.75rem;
        line-height: 1.5;
      }

      .miimiid-auth-footer strong { color: #94a3b8; }

      .miimiid-auth-verification { display: none; }
      .miimiid-auth-verification.show { display: block; }
      .miimiid-auth-main.hide { display: none; }

      .miimiid-auth-code {
        width: 100%;
        min-height: 56px;
        text-align: center;
        letter-spacing: 0.48em;
        padding-left: 0.48em;
        font-size: 1.35rem;
        font-weight: 800;
      }

      .miimiid-auth-resend {
        width: 100%;
        min-height: 42px;
        border: 1px solid var(--auth-border);
        border-radius: 10px;
        color: #bae6fd;
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
      }

      .miimiid-auth-resend:hover:not(:disabled) { background: rgba(56, 189, 248, 0.07); border-color: rgba(56, 189, 248, 0.35); }
      .miimiid-auth-resend:disabled { opacity: 0.55; cursor: not-allowed; }

      .miimiid-auth-back {
        margin-top: 8px;
        width: 100%;
        border: 0;
        color: #94a3b8;
        background: transparent;
        cursor: pointer;
        font: inherit;
        font-size: 0.82rem;
      }
      .miimiid-auth-back:hover { color: #e2e8f0; }

      @media (max-width: 520px) {
        .miimiid-auth-page { padding: 16px 12px; }
        .miimiid-auth-card { padding: 23px 18px; border-radius: 20px; }
        .miimiid-auth-grid { grid-template-columns: 1fr; gap: 16px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .miimiid-auth-input, .miimiid-auth-select, .miimiid-auth-submit, .miimiid-auth-tab { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function responseMessage(payload, fallback) {
    return payload?.message || payload?.error || payload?.data?.message || fallback;
  }

  async function postJson(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });

    let payload = null;
    try { payload = await response.json(); } catch (_) {}

    if (!response.ok) {
      const error = new Error(responseMessage(payload, `Request failed (${response.status}).`));
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  function createAuthShell() {
    injectStyles();

    const existing = document.getElementById(AUTH_ROOT_ID);
    if (existing) existing.remove();

    const auth = document.createElement('main');
    auth.id = AUTH_ROOT_ID;
    auth.className = 'miimiid-auth-page';
    auth.setAttribute('aria-label', 'Miimiid authentication');

    auth.innerHTML = `
      <section class="miimiid-auth-card">
        <div class="miimiid-auth-main" id="miimiid-auth-main">
          <div class="miimiid-auth-brand" aria-label="Miimiid">
            <div class="miimiid-auth-logo" aria-hidden="true">M</div>
            <p class="miimiid-auth-brand-name">Miimiid</p>
          </div>

          <h1 class="miimiid-auth-heading" id="miimiid-auth-heading">Welcome back</h1>
          <p class="miimiid-auth-subtitle" id="miimiid-auth-subtitle">Sign in to continue your learning journey.</p>

          <div class="miimiid-auth-tabs" role="tablist" aria-label="Authentication options">
            <button class="miimiid-auth-tab active" id="miimiid-auth-login-tab" type="button" role="tab" aria-selected="true">Sign in</button>
            <button class="miimiid-auth-tab" id="miimiid-auth-register-tab" type="button" role="tab" aria-selected="false">Create account</button>
          </div>

          <div class="miimiid-auth-message" id="miimiid-auth-message" role="alert" aria-live="polite"></div>

          <form class="miimiid-auth-form" id="miimiid-login-form" novalidate>
            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-login-identifier">Email <span class="miimiid-auth-required">*</span></label>
              <input class="miimiid-auth-input" id="miimiid-login-identifier" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
            </div>

            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-login-password">Password <span class="miimiid-auth-required">*</span></label>
              <div class="miimiid-auth-input-wrap">
                <input class="miimiid-auth-input" id="miimiid-login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required>
                <button class="miimiid-auth-password-toggle" type="button" data-target="miimiid-login-password" aria-label="Show password">Show</button>
              </div>
            </div>

            <button class="miimiid-auth-submit" id="miimiid-login-submit" type="submit">Sign in</button>
          </form>

          <form class="miimiid-auth-form" id="miimiid-register-form" style="display:none" novalidate>
            <div class="miimiid-auth-grid">
              <div class="miimiid-auth-field">
                <label class="miimiid-auth-label" for="miimiid-register-first-name">First name <span class="miimiid-auth-required">*</span></label>
                <input class="miimiid-auth-input" id="miimiid-register-first-name" name="firstName" type="text" autocomplete="given-name" maxlength="50" placeholder="David" required>
              </div>
              <div class="miimiid-auth-field">
                <label class="miimiid-auth-label" for="miimiid-register-last-name">Last name <span class="miimiid-auth-required">*</span></label>
                <input class="miimiid-auth-input" id="miimiid-register-last-name" name="lastName" type="text" autocomplete="family-name" maxlength="50" placeholder="James" required>
              </div>
            </div>

            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-register-email">Email <span class="miimiid-auth-required">*</span></label>
              <input class="miimiid-auth-input" id="miimiid-register-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com" required>
            </div>

            <div class="miimiid-auth-grid">
              <div class="miimiid-auth-field">
                <label class="miimiid-auth-label" for="miimiid-register-gender">Gender <span class="miimiid-auth-required">*</span></label>
                <select class="miimiid-auth-select" id="miimiid-register-gender" name="gender" required>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div class="miimiid-auth-field">
                <label class="miimiid-auth-label" for="miimiid-register-dob">Date of birth <span class="miimiid-auth-required">*</span></label>
                <input class="miimiid-auth-input" id="miimiid-register-dob" name="dateOfBirth" type="date" autocomplete="bday" required>
              </div>
            </div>

            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-register-password">Password <span class="miimiid-auth-required">*</span></label>
              <div class="miimiid-auth-input-wrap">
                <input class="miimiid-auth-input" id="miimiid-register-password" name="password" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters" required>
                <button class="miimiid-auth-password-toggle" type="button" data-target="miimiid-register-password" aria-label="Show password">Show</button>
              </div>
              <p class="miimiid-auth-help">Use at least 8 characters. A longer password is better.</p>
            </div>

            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-register-confirm">Confirm password <span class="miimiid-auth-required">*</span></label>
              <div class="miimiid-auth-input-wrap">
                <input class="miimiid-auth-input" id="miimiid-register-confirm" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Re-enter your password" required>
                <button class="miimiid-auth-password-toggle" type="button" data-target="miimiid-register-confirm" aria-label="Show password">Show</button>
              </div>
            </div>

            <button class="miimiid-auth-submit" id="miimiid-register-submit" type="submit">Create account</button>
          </form>

          <p class="miimiid-auth-footer">By continuing, you agree to use Miimiid responsibly and keep your account secure.</p>
        </div>

        <div class="miimiid-auth-verification" id="miimiid-auth-verification">
          <div class="miimiid-auth-brand" aria-hidden="true">
            <div class="miimiid-auth-logo">✓</div>
          </div>
          <h1 class="miimiid-auth-heading">Check your email</h1>
          <p class="miimiid-auth-subtitle" id="miimiid-verification-copy">We sent a 6-digit verification code to your email address.</p>
          <div class="miimiid-auth-message" id="miimiid-verification-message" role="alert" aria-live="polite"></div>

          <form class="miimiid-auth-form" id="miimiid-verification-form" novalidate>
            <div class="miimiid-auth-field">
              <label class="miimiid-auth-label" for="miimiid-register-verification-code">Verification code <span class="miimiid-auth-required">*</span></label>
              <input class="miimiid-auth-input miimiid-auth-code" id="miimiid-register-verification-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required>
            </div>
            <button class="miimiid-auth-submit" id="miimiid-verify-account-submit" type="submit">Verify account</button>
            <button class="miimiid-auth-resend" id="miimiid-resend-verification" type="button">Resend code</button>
            <button class="miimiid-auth-back" id="miimiid-verification-back" type="button">Back to sign in</button>
          </form>
        </div>
      </section>
    `;

    document.body.innerHTML = '';
    document.body.appendChild(auth);
    bindAuth(auth);
  }

  function setMessage(element, message, type) {
    element.textContent = message || '';
    element.className = `miimiid-auth-message ${message ? `show ${type || 'error'}` : ''}`;
  }

  function setBusy(button, busy, busyLabel) {
    if (!button) return;
    if (busy) {
      button.dataset.originalLabel = button.textContent;
      button.textContent = busyLabel || 'Please wait…';
    } else {
      button.textContent = button.dataset.originalLabel || button.textContent;
      delete button.dataset.originalLabel;
    }
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
  }

  function switchMode(mode) {
    const login = mode === 'login';
    const loginForm = document.getElementById('miimiid-login-form');
    const registerForm = document.getElementById('miimiid-register-form');
    const loginTab = document.getElementById('miimiid-auth-login-tab');
    const registerTab = document.getElementById('miimiid-auth-register-tab');
    const heading = document.getElementById('miimiid-auth-heading');
    const subtitle = document.getElementById('miimiid-auth-subtitle');
    const message = document.getElementById('miimiid-auth-message');

    loginForm.style.display = login ? 'grid' : 'none';
    registerForm.style.display = login ? 'none' : 'grid';
    loginTab.classList.toggle('active', login);
    registerTab.classList.toggle('active', !login);
    loginTab.setAttribute('aria-selected', String(login));
    registerTab.setAttribute('aria-selected', String(!login));
    heading.textContent = login ? 'Welcome back' : 'Create your account';
    subtitle.textContent = login
      ? 'Sign in to continue your learning journey.'
      : 'Create your Miimiid account and start learning.';
    setMessage(message, '', '');
  }

  function bindPasswordToggles(root) {
    root.querySelectorAll('.miimiid-auth-password-toggle').forEach((button) => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.target);
        if (!input) return;
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        button.textContent = visible ? 'Show' : 'Hide';
        button.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
      });
    });
  }

  function bindAuth(root) {
    const loginTab = document.getElementById('miimiid-auth-login-tab');
    const registerTab = document.getElementById('miimiid-auth-register-tab');
    const loginForm = document.getElementById('miimiid-login-form');
    const registerForm = document.getElementById('miimiid-register-form');
    const verificationForm = document.getElementById('miimiid-verification-form');
    const main = document.getElementById('miimiid-auth-main');
    const verification = document.getElementById('miimiid-auth-verification');
    const authMessage = document.getElementById('miimiid-auth-message');
    const verificationMessage = document.getElementById('miimiid-verification-message');
    const verificationCopy = document.getElementById('miimiid-verification-copy');
    const resendButton = document.getElementById('miimiid-resend-verification');
    let pendingEmail = '';
    let resendTimer = null;

    loginTab.addEventListener('click', () => switchMode('login'));
    registerTab.addEventListener('click', () => switchMode('register'));
    bindPasswordToggles(root);

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage(authMessage, '', '');

      const email = document.getElementById('miimiid-login-identifier').value.trim().toLowerCase();
      const password = document.getElementById('miimiid-login-password').value;
      const submit = document.getElementById('miimiid-login-submit');

      if (!email || !email.includes('@')) {
        setMessage(authMessage, 'Enter a valid email address.', 'error');
        return;
      }
      if (!password) {
        setMessage(authMessage, 'Enter your password.', 'error');
        return;
      }

      setBusy(submit, true, 'Signing in…');
      try {
        const result = await postJson('/api/auth/login', { identifier: email, password });
        if (result?.data?.user || result?.user) {
          window.location.reload();
          return;
        }
        setMessage(authMessage, 'Signed in, but the session could not be confirmed. Please refresh and try again.', 'error');
      } catch (error) {
        setMessage(authMessage, error.message || 'Unable to sign in. Please try again.', 'error');
      } finally {
        setBusy(submit, false);
      }
    });

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage(authMessage, '', '');

      const firstName = document.getElementById('miimiid-register-first-name').value.trim();
      const lastName = document.getElementById('miimiid-register-last-name').value.trim();
      const email = document.getElementById('miimiid-register-email').value.trim().toLowerCase();
      const gender = document.getElementById('miimiid-register-gender').value;
      const dateOfBirth = document.getElementById('miimiid-register-dob').value;
      const password = document.getElementById('miimiid-register-password').value;
      const confirmPassword = document.getElementById('miimiid-register-confirm').value;
      const submit = document.getElementById('miimiid-register-submit');

      if (!firstName || !lastName) {
        setMessage(authMessage, 'Enter your first and last name.', 'error');
        return;
      }
      if (!email || !email.includes('@')) {
        setMessage(authMessage, 'Enter a valid email address.', 'error');
        return;
      }
      if (!gender) {
        setMessage(authMessage, 'Select your gender.', 'error');
        return;
      }
      if (!dateOfBirth) {
        setMessage(authMessage, 'Enter your date of birth.', 'error');
        return;
      }
      if (password.length < 8) {
        setMessage(authMessage, 'Password must be at least 8 characters.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        setMessage(authMessage, 'Passwords do not match.', 'error');
        return;
      }

      setBusy(submit, true, 'Creating account…');
      try {
        const result = await postJson('/api/auth/register', {
          firstName,
          lastName,
          email,
          gender,
          dateOfBirth,
          password
        });

        pendingEmail = email;
        const masked = result?.data?.maskedEmail || email;
        verificationCopy.textContent = `We sent a 6-digit verification code to ${masked}. The code expires in 5 minutes.`;
        main.classList.add('hide');
        verification.classList.add('show');
        setMessage(verificationMessage, 'Verification email sent. Enter the code to activate your account.', 'success');
        document.getElementById('miimiid-register-verification-code').focus();
      } catch (error) {
        setMessage(authMessage, error.message || 'Unable to create your account. Please try again.', 'error');
      } finally {
        setBusy(submit, false);
      }
    });

    verificationForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      setMessage(verificationMessage, '', '');
      const codeInput = document.getElementById('miimiid-register-verification-code');
      const submit = document.getElementById('miimiid-verify-account-submit');
      const code = codeInput.value.trim();

      if (!/^\d{6}$/.test(code)) {
        setMessage(verificationMessage, 'Enter the 6-digit verification code.', 'error');
        return;
      }

      setBusy(submit, true, 'Verifying…');
      try {
        const result = await postJson('/api/auth/verify-account', { email: pendingEmail, code });
        if (result?.data?.user || result?.user || result?.status === 'success') {
          setMessage(verificationMessage, 'Your account is verified. Loading your account…', 'success');
          window.setTimeout(() => window.location.reload(), 350);
          return;
        }
        setMessage(verificationMessage, 'Verification completed, but the session could not be confirmed.', 'error');
      } catch (error) {
        setMessage(verificationMessage, error.message || 'Invalid or expired verification code.', 'error');
      } finally {
        setBusy(submit, false);
      }
    });

    resendButton.addEventListener('click', async () => {
      if (!pendingEmail || resendButton.disabled) return;
      setMessage(verificationMessage, '', '');
      resendButton.disabled = true;
      resendButton.textContent = 'Sending…';
      try {
        await postJson('/api/auth/resend-verification', { email: pendingEmail });
        setMessage(verificationMessage, 'A new verification code has been sent.', 'success');
        let seconds = 30;
        resendButton.textContent = `Resend code in ${seconds}s`;
        resendTimer = window.setInterval(() => {
          seconds -= 1;
          if (seconds <= 0) {
            window.clearInterval(resendTimer);
            resendTimer = null;
            resendButton.disabled = false;
            resendButton.textContent = 'Resend code';
            return;
          }
          resendButton.textContent = `Resend code in ${seconds}s`;
        }, 1000);
      } catch (error) {
        resendButton.disabled = false;
        resendButton.textContent = 'Resend code';
        setMessage(verificationMessage, error.message || 'Unable to resend the code right now.', 'error');
      }
    });

    document.getElementById('miimiid-verification-back').addEventListener('click', () => {
      if (resendTimer) window.clearInterval(resendTimer);
      resendTimer = null;
      resendButton.disabled = false;
      resendButton.textContent = 'Resend code';
      verification.classList.remove('show');
      main.classList.remove('hide');
      switchMode('login');
      setMessage(authMessage, '', '');
    });

    const codeInput = document.getElementById('miimiid-register-verification-code');
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
    });
  }

  function boot() {
    const start = () => createAuthShell();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }

  boot();
})();
