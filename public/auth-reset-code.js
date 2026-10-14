/*
 * Miimiid - password reset by emailed 6-digit code.
 *
 * Flow: Forgot password -> enter email -> enter 6-digit code (with countdown)
 *       -> existing "new password" screen.
 *
 * This file only adds behavior. It reuses the page's existing helpers
 * (setMiimiidAuthStatus, getMiimiidAsyncButton, showMiimiidAuthMode,
 * miimiidSafeAuthMessage) and the existing reset-password screen/handler.
 */
(function () {
  "use strict";

  var FORM_ID = "miimiid-reset-code-form";
  var MODE = "resetcode";

  var codeEmail = "";
  var expiresAt = 0;
  var timerId = null;

  /* ---------- small helpers ---------- */

  function t(key, fallback) {
    try {
      if (typeof miimiidSafeAuthMessage === "function") {
        return miimiidSafeAuthMessage(key, fallback);
      }
    } catch (error) {}
    return fallback;
  }

  function setStatus(message, type) {
    if (typeof setMiimiidAuthStatus === "function") {
      setMiimiidAuthStatus(message || "", type || "");
    }
  }

  function getAsyncButton(element) {
    try {
      if (typeof getMiimiidAsyncButton === "function") {
        return getMiimiidAsyncButton(element);
      }
    } catch (error) {}
    return null;
  }

  async function runWithButton(element, work) {
    var controller = getAsyncButton(element);
    if (controller && typeof controller.run === "function") {
      await controller.run(work);
    } else {
      await work();
    }
  }

  function friendlyError(error, fallback) {
    if (error instanceof TypeError) {
      return t(
        "authServerUnreachable",
        "Can't reach the server. Check your connection and try again."
      );
    }
    var message = error && typeof error.message === "string" ? error.message.trim() : "";
    if (!message || /ECONN|ETIMEDOUT|ENOTFOUND|Mongo|ValidationError|^Error:/i.test(message)) {
      return fallback;
    }
    return message;
  }

  async function postJson(url, payload) {
    var response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    var result = null;
    try {
      result = await response.json();
    } catch (error) {}

    if (!response.ok || !result || result.status !== "success") {
      throw new Error(result && result.message ? result.message : "");
    }
    return result;
  }

  /* ---------- countdown ---------- */

  function clearTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer(seconds) {
    clearTimer();

    var total = Number(seconds);
    if (!Number.isFinite(total) || total <= 0) return;

    expiresAt = Date.now() + total * 1000;

    function tick() {
      var remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      var minutes = Math.floor(remaining / 60);
      var secs = String(remaining % 60).padStart(2, "0");
      var label = document.getElementById("miimiid-reset-code-timer");

      if (label) {
        label.textContent =
          remaining > 0
            ? t("authCodeExpiresIn", "Code expires in") + " " + minutes + ":" + secs
            : t("authCodeExpired", "Code expired. Request a new code.");
      }

      if (remaining <= 0) clearTimer();
    }

    tick();
    timerId = setInterval(tick, 1000);
  }

  /* ---------- code screen ---------- */

  function buildForm() {
    var existing = document.getElementById(FORM_ID);
    if (existing) return existing;

    var forgotForm = document.getElementById("miimiid-forgot-form");
    if (!forgotForm || !forgotForm.parentNode) return null;

    var form = document.createElement("form");
    form.id = FORM_ID;
    form.className = "miimiid-auth-form hidden";
    form.setAttribute("novalidate", "");
    form.innerHTML =
      '<div class="miimiid-auth-field">' +
        '<p class="miimiid-auth-help" id="miimiid-reset-code-message"></p>' +
        '<p class="miimiid-auth-help" id="miimiid-reset-code-email"></p>' +
        '<p class="miimiid-auth-help" id="miimiid-reset-code-timer" aria-live="polite"></p>' +
        '<label for="miimiid-reset-code-input" id="miimiid-reset-code-label"></label>' +
        '<input id="miimiid-reset-code-input" type="text" inputmode="numeric" ' +
          'autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}">' +
      "</div>" +
      '<button type="submit" class="btn" id="miimiid-reset-code-submit"></button>' +
      '<button type="button" class="miimiid-auth-link" id="miimiid-reset-code-resend"></button>' +
      '<button type="button" class="miimiid-auth-link" id="miimiid-reset-code-back"></button>';

    forgotForm.parentNode.insertBefore(form, forgotForm.nextSibling);

    document.getElementById("miimiid-reset-code-message").textContent =
      t("authVerificationInstruction", "Enter the 6-digit code sent to your email address.");
    document.getElementById("miimiid-reset-code-label").textContent =
      t("authResetCodeLabel", "Reset code");
    document.getElementById("miimiid-reset-code-submit").textContent =
      t("authVerifyResetCode", "Verify code");
    document.getElementById("miimiid-reset-code-resend").textContent =
      t("authResendCode", "Resend code");
    document.getElementById("miimiid-reset-code-back").textContent =
      t("authBack", "Back");

    var input = document.getElementById("miimiid-reset-code-input");
    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      verifyCode();
    });

    document
      .getElementById("miimiid-reset-code-resend")
      .addEventListener("click", function () {
        requestCode(codeEmail, this, true);
      });

    document
      .getElementById("miimiid-reset-code-back")
      .addEventListener("click", function () {
        clearTimer();
        goToMode("forgot");
      });

    return form;
  }

  function goToMode(mode) {
    if (typeof window.showMiimiidAuthMode === "function") {
      window.showMiimiidAuthMode(mode);
    }
  }

  function showCodeScreen(maskedEmail, expiresInSeconds) {
    var form = buildForm();
    if (!form) return;

    var emailLabel = document.getElementById("miimiid-reset-code-email");
    if (emailLabel) emailLabel.textContent = maskedEmail || codeEmail;

    var input = document.getElementById("miimiid-reset-code-input");
    if (input) input.value = "";

    goToMode(MODE);
    startTimer(expiresInSeconds);

    if (input) input.focus();
  }

  /* ---------- API calls ---------- */

  async function requestCode(email, buttonElement, isResend) {
    if (!email) {
      setStatus(t("authEnterEmail", "Enter your email address."), "error");
      return;
    }

    setStatus(t("authSendingResetInstructions", "Sending..."));

    await runWithButton(buttonElement, async function () {
      try {
        var result = await postJson("/api/auth/forgot-password-code", { email: email });
        var data = result.data || {};

        codeEmail = email;
        showCodeScreen(data.maskedEmail || email, data.expiresInSeconds);

        // showCodeScreen switches screens, which clears the status line.
        if (isResend) {
          setStatus(t("authVerificationCodeSent", "A new code has been sent."), "success");
        }
      } catch (error) {
        console.error("Miimiid reset code request error:", error);
        setStatus(
          friendlyError(error, t("authRequestResetError", "Unable to send the reset code. Please try again.")),
          "error"
        );
      }
    });
  }

  async function verifyCode() {
    var input = document.getElementById("miimiid-reset-code-input");
    var code = input ? input.value.trim() : "";
    var submit = document.getElementById("miimiid-reset-code-submit");

    if (!/^\d{6}$/.test(code)) {
      setStatus(t("authVerificationCodeRequired", "Enter the 6-digit verification code."), "error");
      return;
    }

    if (!codeEmail) {
      setStatus(t("authVerificationSessionMissing", "Your session is missing. Please start again."), "error");
      return;
    }

    setStatus(t("authVerifyingAccount", "Verifying..."));

    await runWithButton(submit, async function () {
      try {
        var result = await postJson("/api/auth/verify-reset-code", { email: codeEmail, code: code });
        var token = result.data && result.data.resetToken;

        if (!token) {
          throw new Error("");
        }

        clearTimer();

        // The existing reset-password handler reads the token from the URL.
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + "?resetToken=" + encodeURIComponent(token)
        );

        goToMode("reset");
        setStatus(t("authResetCodeVerified", "Code verified. Choose a new password."), "success");
      } catch (error) {
        console.error("Miimiid reset code verification error:", error);
        setStatus(
          friendlyError(error, t("authUnableVerifyAccount", "Unable to verify the code.")),
          "error"
        );
      }
    });
  }

  /* ---------- wiring ---------- */

  // Take over the Forgot Password form before the old link-based handler runs.
  document.addEventListener(
    "submit",
    function (event) {
      var target = event.target;
      if (!target || target.id !== "miimiid-forgot-form") return;

      event.preventDefault();
      event.stopImmediatePropagation();

      var emailInput = document.getElementById("miimiid-forgot-identifier");
      var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      var submit = document.getElementById("miimiid-forgot-submit");

      requestCode(email, submit, false);
    },
    true
  );

  // Keep the new screen in sync with the page's own screen switcher.
  function installModeHook() {
    var original = window.showMiimiidAuthMode;
    if (typeof original !== "function" || original.__resetCodeHook) return;

    var hooked = function (mode) {
      var output = original.apply(this, arguments);
      var form = document.getElementById(FORM_ID);

      if (form) {
        var show = mode === MODE;
        form.classList.toggle("hidden", !show);

        if (show) {
          var title = document.getElementById("miimiid-auth-title");
          var subtitle = document.getElementById("miimiid-auth-subtitle");
          if (title) {
            title.classList.remove("hidden");
            title.textContent = t("authResetPassword", "Reset Password");
          }
          if (subtitle) {
            subtitle.classList.remove("hidden");
            subtitle.textContent = t("authResetCodeSubtitle", "Enter the code we emailed you");
          }
        } else {
          clearTimerIfLeaving(mode);
        }
      }

      return output;
    };

    hooked.__resetCodeHook = true;
    window.showMiimiidAuthMode = hooked;
  }

  function clearTimerIfLeaving(mode) {
    if (mode === "login" || mode === "register") clearTimer();
  }

  function init() {
    buildForm();
    installModeHook();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
      
