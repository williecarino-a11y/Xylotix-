(() => {
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
})();
