(() => {
  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const createInstallPrompt = () => {
    if (isStandalone() || document.getElementById('miimiid-install-prompt')) return;

    const prompt = document.createElement('aside');
    prompt.id = 'miimiid-install-prompt';
    prompt.className = 'miimiid-install-prompt hidden';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-label', 'Install Miimiid');
    prompt.innerHTML = `
      <div class="miimiid-install-copy">
        <strong>Install Miimiid</strong>
        <span>Get the app-style experience on your device.</span>
      </div>
      <div class="miimiid-install-actions">
        <button type="button" class="miimiid-install-btn" data-install>Install</button>
        <button type="button" class="miimiid-install-dismiss" data-dismiss aria-label="Dismiss install prompt">×</button>
      </div>
    `;

    document.body.appendChild(prompt);

    prompt.querySelector('[data-dismiss]').addEventListener('click', () => {
      prompt.classList.add('hidden');
      sessionStorage.setItem('miimiid-install-dismissed', '1');
    });

    return prompt;
  };

  const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.info('Miimiid PWA ready.', registration.scope);
        })
        .catch((error) => {
          console.warn('Miimiid PWA registration failed:', error);
        });
    });
  };

  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    const prompt = createInstallPrompt();
    if (!prompt || sessionStorage.getItem('miimiid-install-dismissed')) return;

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
    document.getElementById('miimiid-install-prompt')?.remove();
    console.info('Miimiid installed successfully.');
  });

  registerServiceWorker();
})();
