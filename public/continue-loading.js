(function () {
  'use strict';

  const DEFAULTS = {
    message: 'Please wait…',
    context: 'global',
    delay: 120
  };

  const active = new Map();
  let overlay = null;
  let overlayCount = 0;
  let overlayTimer = null;

  const messages = {
    auth: 'Signing you in…',
    register: 'Creating your account…',
    verification: 'Verifying your account…',
    dashboard: 'Loading your dashboard…',
    lesson: 'Loading lesson…',
    quiz: 'Submitting your answer…',
    progress: 'Saving your progress…',
    ai: 'Preparing your AI Tutor…',
    fun: 'Loading Fun Center…',
    generic: 'Please wait…'
  };

  function installBrandAssets() {
    if (!document.head) return;

    const favicon = document.head.querySelector('link[data-miimiid-favicon]');
    if (!favicon) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = '/favicon.svg';
      link.dataset.miimiidFavicon = 'true';
      document.head.appendChild(link);
    }

    const touchIcon = document.head.querySelector('link[data-miimiid-touch-icon]');
    if (!touchIcon) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/icons/icon-192.svg';
      link.dataset.miimiidTouchIcon = 'true';
      document.head.appendChild(link);
    }
  }

  function resolveMessage(context, explicit) {
    if (explicit) return explicit;
    return messages[context] || DEFAULTS.message;
  }

  function ensureStyles() {
    if (document.getElementById('continue-loading-styles')) return;

    const style = document.createElement('style');
    style.id = 'continue-loading-styles';
    style.textContent = `
      .continue-loading-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(3px);
      }

      .continue-loading-card {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        min-width: 180px;
        max-width: min(90vw, 420px);
        padding: 14px 18px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        background: #1e293b;
        color: #f8fafc;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
      }

      .continue-loading-arc {
        width: 20px;
        height: 20px;
        flex: 0 0 20px;
        border: 3px solid rgba(148, 163, 184, 0.25);
        border-top-color: currentColor;
        border-right-color: currentColor;
        border-radius: 50%;
        animation: continue-loading-spin 0.72s linear infinite;
      }

      .continue-loading-text {
        font-size: 0.92rem;
        font-weight: 600;
        line-height: 1.35;
      }

      .continue-loading-button {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        gap: 8px;
        pointer-events: none;
      }

      .continue-loading-button .continue-loading-arc {
        width: 15px;
        height: 15px;
        flex-basis: 15px;
        border-width: 2px;
      }

      @keyframes continue-loading-spin {
        to { transform: rotate(360deg); }
      }

      @media (prefers-reduced-motion: reduce) {
        .continue-loading-arc { animation-duration: 1.6s; }
      }
    `;
    document.head.appendChild(style);
  }

  function makeArc() {
    const arc = document.createElement('span');
    arc.className = 'continue-loading-arc';
    arc.setAttribute('aria-hidden', 'true');
    return arc;
  }

  function makeOverlay(message) {
    ensureStyles();

    const wrapper = document.createElement('div');
    wrapper.className = 'continue-loading-overlay';
    wrapper.setAttribute('role', 'status');
    wrapper.setAttribute('aria-live', 'polite');
    wrapper.setAttribute('aria-busy', 'true');

    const card = document.createElement('div');
    card.className = 'continue-loading-card';
    card.appendChild(makeArc());

    const text = document.createElement('span');
    text.className = 'continue-loading-text';
    text.textContent = message;
    card.appendChild(text);

    wrapper.appendChild(card);
    return wrapper;
  }

  function startOverlay(options) {
    const config = { ...DEFAULTS, ...(options || {}) };
    const key = config.id || `${config.context}:${Date.now()}:${Math.random()}`;

    if (active.has(key)) return key;
    active.set(key, config);
    overlayCount += 1;

    if (!overlayTimer && !overlay) {
      overlayTimer = window.setTimeout(() => {
        overlayTimer = null;
        if (overlayCount > 0 && !overlay) {
          overlay = makeOverlay(resolveMessage(config.context, config.message));
          document.body.appendChild(overlay);
          document.documentElement.setAttribute('aria-busy', 'true');
        }
      }, Math.max(0, Number(config.delay) || 0));
    }

    return key;
  }

  function stopOverlay(key) {
    if (!active.has(key)) return;
    active.delete(key);
    overlayCount = Math.max(0, overlayCount - 1);

    if (overlayCount === 0) {
      if (overlayTimer) {
        window.clearTimeout(overlayTimer);
        overlayTimer = null;
      }
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      document.documentElement.removeAttribute('aria-busy');
    }
  }

  function startButton(button, options) {
    if (!button || !(button instanceof HTMLElement)) return null;
    ensureStyles();

    const config = { ...DEFAULTS, ...(options || {}) };
    if (button.dataset.continueLoading === 'true') return button.dataset.continueLoadingId || null;

    const id = config.id || `button:${Date.now()}:${Math.random()}`;
    const original = {
      html: button.innerHTML,
      disabled: button.disabled,
      ariaBusy: button.getAttribute('aria-busy')
    };

    button.dataset.continueLoading = 'true';
    button.dataset.continueLoadingId = id;
    button.dataset.continueLoadingOriginal = JSON.stringify(original);
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('continue-loading-button');
    button.replaceChildren(makeArc());

    const text = document.createElement('span');
    text.textContent = resolveMessage(config.context, config.message);
    button.appendChild(text);

    return id;
  }

  function stopButton(button) {
    if (!button || button.dataset.continueLoading !== 'true') return;

    let original = null;
    try {
      original = JSON.parse(button.dataset.continueLoadingOriginal || 'null');
    } catch (_) {}

    if (original) {
      button.innerHTML = original.html;
      button.disabled = original.disabled;
      if (original.ariaBusy === null) button.removeAttribute('aria-busy');
      else button.setAttribute('aria-busy', original.ariaBusy);
    }

    button.classList.remove('continue-loading-button');
    delete button.dataset.continueLoading;
    delete button.dataset.continueLoadingId;
    delete button.dataset.continueLoadingOriginal;
  }

  function start(options) {
    const config = { ...DEFAULTS, ...(options || {}) };
    if (config.target) {
      const target = typeof config.target === 'string'
        ? document.querySelector(config.target)
        : config.target;
      if (target instanceof HTMLElement && target.matches('button, input[type="submit"], input[type="button"]')) {
        return { type: 'button', id: startButton(target, config), target };
      }
    }
    return { type: 'overlay', id: startOverlay(config) };
  }

  function stop(handle) {
    if (!handle) return;
    if (handle.type === 'button') stopButton(handle.target);
    else stopOverlay(handle.id);
  }

  function update(handle, message) {
    if (!handle || !message) return;
    if (handle.type === 'button' && handle.target) {
      const text = handle.target.querySelector('.continue-loading-text');
      if (text) text.textContent = message;
      return;
    }
    if (overlay) {
      const text = overlay.querySelector('.continue-loading-text');
      if (text) text.textContent = message;
    }
  }

  async function wrap(task, options) {
    const handle = start(options);
    try {
      return await task();
    } finally {
      stop(handle);
    }
  }

  function contextFromRequest(input) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url) return 'generic';
    if (url.includes('/api/auth/register')) return 'register';
    if (url.includes('/api/auth/verify-account')) return 'verification';
    if (url.includes('/api/auth/login')) return 'auth';
    if (url.includes('/api/auth/resend-verification')) return 'verification';
    if (url.includes('/api/ai-tutor/')) return 'ai';
    if (url.includes('/api/fun-center/')) return 'fun';
    if (url.includes('/api/learn/')) return 'lesson';
    return 'generic';
  }

  function installFetchBridge() {
    if (window.__continueLoadingFetchInstalled || typeof window.fetch !== 'function') return;
    window.__continueLoadingFetchInstalled = true;

    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const context = contextFromRequest(input);
      const headers = init && init.headers;
      const disabled = headers && typeof headers.get === 'function'
        ? headers.get('X-Continue-Loading') === 'false'
        : headers && String(headers['X-Continue-Loading'] || '').toLowerCase() === 'false';

      if (disabled) return nativeFetch(input, init);

      const handle = start({ context });
      return nativeFetch(input, init).finally(() => stop(handle));
    };
  }

  window.ContinueLoading = Object.freeze({
    start,
    stop,
    update,
    wrap,
    startButton,
    stopButton,
    messages: Object.freeze({ ...messages })
  });

  function boot() {
    installBrandAssets();
    ensureStyles();
    installFetchBridge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
