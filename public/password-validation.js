(function () {
  'use strict';

  const MIN_LENGTH = 8;

  function validateField(input) {
    if (!input) return true;

    const value = String(input.value || '');

    // Do not start a request or loading state while the user is typing.
    // A short password is handled locally and immediately.
    if (!value) {
      input.setCustomValidity('');
      return true;
    }

    if (value.length < MIN_LENGTH) {
      input.setCustomValidity(`Password must be at least ${MIN_LENGTH} characters.`);
      return false;
    }

    input.setCustomValidity('');
    return true;
  }

  function boot() {
    const fields = Array.from(document.querySelectorAll('input[type="password"]'));

    fields.forEach((input) => {
      input.addEventListener('input', () => validateField(input), { passive: true });
      input.addEventListener('blur', () => validateField(input), { passive: true });
    });

    // Capture the submit event so invalid short passwords never reach the
    // authentication request/loading layer.
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const passwordFields = Array.from(form.querySelectorAll('input[type="password"]'));
      const invalid = passwordFields.some((input) => !validateField(input));

      if (invalid) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const firstInvalid = passwordFields.find((input) => !validateField(input));
        firstInvalid?.reportValidity();
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
