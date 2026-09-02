(function () {
  function boot() {
    if (typeof initializeMiimiidPasswordToggles === "function") {
      initializeMiimiidPasswordToggles();
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
