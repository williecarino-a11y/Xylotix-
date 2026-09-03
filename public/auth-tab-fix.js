(function () {
  'use strict';

  const STYLE_ID = 'miimiid-auth-tab-fix';

  function install() {
    const root = document.getElementById('miimiid-auth-view');
    const loginTab = document.getElementById('miimiid-auth-login-tab');
    const registerTab = document.getElementById('miimiid-auth-register-tab');
    const loginForm = document.getElementById('miimiid-login-form');
    const registerForm = document.getElementById('miimiid-register-form');

    if (!root || !loginTab || !registerTab || !loginForm || !registerForm) return false;

    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        #miimiid-login-form.miimiid-visible,
        #miimiid-register-form.miimiid-visible { display:grid !important; }
        #miimiid-login-form.miimiid-hidden,
        #miimiid-register-form.miimiid-hidden { display:none !important; }
      `;
      document.head.appendChild(style);
    }

    const heading = document.getElementById('miimiid-auth-heading');
    const subtitle = document.getElementById('miimiid-auth-subtitle');
    const message = document.getElementById('miimiid-auth-message');

    function setMode(mode) {
      const register = mode === 'register';

      loginForm.classList.toggle('miimiid-visible', !register);
      loginForm.classList.toggle('miimiid-hidden', register);
      registerForm.classList.toggle('miimiid-visible', register);
      registerForm.classList.toggle('miimiid-hidden', !register);

      loginTab.classList.toggle('active', !register);
      registerTab.classList.toggle('active', register);
      loginTab.setAttribute('aria-selected', String(!register));
      registerTab.setAttribute('aria-selected', String(register));

      if (heading) heading.textContent = register ? 'Create your account' : 'Welcome back';
      if (subtitle) subtitle.textContent = register
        ? 'Create your Miimiid account and start learning.'
        : 'Sign in to continue your learning journey.';

      if (message) {
        message.textContent = '';
        message.className = 'miimiid-auth-message';
      }
    }

    loginTab.addEventListener('click', () => setMode('login'), true);
    registerTab.addEventListener('click', () => setMode('register'), true);

    const observer = new MutationObserver(() => {
      const registerActive = registerTab.classList.contains('active') || registerTab.getAttribute('aria-selected') === 'true';
      const loginActive = loginTab.classList.contains('active') || loginTab.getAttribute('aria-selected') === 'true';

      if (registerActive && !loginActive) setMode('register');
      else if (loginActive && !registerActive) setMode('login');
    });

    observer.observe(loginTab, { attributes: true, attributeFilter: ['class', 'aria-selected'] });
    observer.observe(registerTab, { attributes: true, attributeFilter: ['class', 'aria-selected'] });

    setMode(
      registerTab.classList.contains('active') || registerTab.getAttribute('aria-selected') === 'true'
        ? 'register'
        : 'login'
    );

    return true;
  }

  function wait() {
    if (!install()) window.setTimeout(wait, 50);
  }

  wait();
})();
