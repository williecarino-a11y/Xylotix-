(() => {
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const createInstallPrompt = () => {
    if (isStandalone() || document.getElementById('xylotix-install-prompt')) return;

    const prompt = document.createElement('aside');
    prompt.id = 'xylotix-install-prompt';
    prompt.className = 'xylotix-install-prompt hidden';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-label', 'Install Xylotix');
    prompt.innerHTML = `
      <div class="xylotix-install-copy">
        <strong>Install Xylotix</strong>
        <span>Get the app-style experience on your device.</span>
      </div>
      <div class="xylotix-install-actions">
        <button type="button" class="xylotix-install-btn" data-install>Install</button>
        <button type="button" class="xylotix-install-dismiss" data-dismiss aria-label="Dismiss install prompt">×</button>
      </div>
    `;

    document.body.appendChild(prompt);

    prompt.querySelector('[data-dismiss]').addEventListener('click', () => {
      prompt.classList.add('hidden');
      sessionStorage.setItem('xylotix-install-dismissed', '1');
    });

    return prompt;
  };

  const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.info('Xylotix PWA ready.', registration.scope);
        })
        .catch((error) => {
          console.warn('Xylotix PWA registration failed:', error);
        });
    });
  };

  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    const prompt = createInstallPrompt();
    if (!prompt || sessionStorage.getItem('xylotix-install-dismissed')) return;

    prompt.classList.remove('hidden');
    prompt.querySelector('[data-install]').addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;

      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      prompt.classList.add('hidden');
    }, { once: true });
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.getElementById('xylotix-install-prompt')?.remove();
    console.info('Xylotix installed successfully.');
  });

  registerServiceWorker();
})();
