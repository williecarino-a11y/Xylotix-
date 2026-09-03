/**
 * Miimiid Authentication Engine
 *
 * Foundation for the unified, state-driven authentication architecture.
 * This module is intentionally additive: existing authentication handlers
 * remain untouched until the engine is wired into the existing UI.
 */
(function (window) {
  "use strict";

  const STATES = Object.freeze({
    IDLE: "idle",
    VALIDATING: "validating",
    SUBMITTING: "submitting",
    SUCCESS: "success",
    ERROR: "error"
  });

  const MODES = Object.freeze({
    LOGIN: "login",
    REGISTER: "register",
    FORGOT: "forgot",
    RESET: "reset"
  });

  const REGISTRATION_STEPS = Object.freeze({
    WELCOME: 1,
    NAME: 2,
    CONTACT: 3,
    PERSONAL: 4,
    PASSWORD: 5,
    VERIFICATION: 6
  });

  const state = {
    mode: MODES.LOGIN,
    registrationStep: REGISTRATION_STEPS.WELCOME,
    action: null,
    status: STATES.IDLE,
    error: null,
    user: null,
    verification: {
      email: "",
      expiresAt: 0
    }
  };

  const listeners = new Set();

  function cloneState() {
    return {
      ...state,
      verification: { ...state.verification }
    };
  }

  function emit() {
    const snapshot = cloneState();
    listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error("Miimiid auth listener failed:", error);
      }
    });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function () {};
    }

    listeners.add(listener);
    listener(cloneState());

    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  function setState(patch) {
    Object.assign(state, patch || {});
    emit();
    return cloneState();
  }

  function setMode(mode) {
    if (!Object.values(MODES).includes(mode)) {
      throw new Error("Unknown authentication mode.");
    }

    setState({
      mode,
      status: STATES.IDLE,
      action: null,
      error: null
    });
  }

  function setRegistrationStep(step) {
    const numericStep = Number(step);

    if (!Object.values(REGISTRATION_STEPS).includes(numericStep)) {
      throw new Error("Unknown registration step.");
    }

    setState({
      registrationStep: numericStep,
      status: STATES.IDLE,
      action: null,
      error: null
    });
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeError(error, fallback) {
    if (error && error.name === "AbortError") {
      return {
        code: "REQUEST_ABORTED",
        message: fallback || "Authentication request was cancelled."
      };
    }

    if (error && typeof error === "object") {
      return {
        code: error.code || "AUTH_ERROR",
        message: error.message || fallback || "Authentication request failed."
      };
    }

    return {
      code: "AUTH_ERROR",
      message: fallback || "Authentication request failed."
    };
  }

  async function request(endpoint, payload, options) {
    const config = options || {};

    const response = await fetch(endpoint, {
      method: config.method || "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "X-Continue-Loading": "false",
        ...(payload === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(config.headers || {})
      },
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: config.signal
    });

    let result = null;

    try {
      result = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw {
          code: `HTTP_${response.status}`,
          message: "The authentication server returned an invalid response."
        };
      }

      throw {
        code: "INVALID_RESPONSE",
        message: "The authentication server returned an invalid response."
      };
    }

    if (!response.ok || !result || result.status !== "success") {
      throw {
        code: result?.code || `HTTP_${response.status}`,
        message: result?.message || "Authentication request failed."
      };
    }

    return result;
  }

  function loadingContext(action) {
    const contexts = {
      login: "auth",
      register: "register",
      "verify-account": "verification",
      logout: "auth",
      forgot: "verification",
      reset: "auth"
    };

    return contexts[action] || "auth";
  }

  async function execute(action, operation, options) {
    if (typeof operation !== "function") {
      throw new TypeError("Authentication operation must be a function.");
    }

    if (state.status === STATES.SUBMITTING) {
      return state.user;
    }

    setState({
      action,
      status: STATES.VALIDATING,
      error: null
    });

    let loadingHandle = null;

    try {
      if (typeof options?.validate === "function") {
        await options.validate();
      }

      setState({
        action,
        status: STATES.SUBMITTING,
        error: null
      });

      if (window.ContinueLoading?.start) {
        loadingHandle = window.ContinueLoading.start({
          id: `auth-action:${action}`,
          context: loadingContext(action),
          message: action === "register"
            ? "Creating your account…"
            : action === "verify-account"
              ? "Verifying your account…"
              : action === "logout"
                ? "Signing you out…"
                : "Signing you in…",
          delay: 120
        });
      }

      const result = await operation();

      const user = result?.data?.user || null;

      if (user) {
        state.user = user;
        window.currentUser = user;
        window.MIIMIID_CURRENT_USER = user;
      }

      setState({
        action: null,
        status: STATES.SUCCESS,
        error: null,
        user: state.user
      });

      return result;
    } catch (error) {
      const normalized = normalizeError(
        error,
        "Authentication request failed."
      );

      setState({
        action: null,
        status: STATES.ERROR,
        error: normalized
      });

      throw normalized;
    } finally {
      if (loadingHandle && window.ContinueLoading?.stop) {
        window.ContinueLoading.stop(loadingHandle);
      }
    }
  }

  function finish() {
    setState({
      action: null,
      status: STATES.IDLE,
      error: null
    });
  }

  function validateEmail(value) {
    const email = normalizeEmail(value);

    if (!email) {
      throw { code: "EMAIL_REQUIRED", message: "Enter your email address." };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw { code: "EMAIL_INVALID", message: "Enter a valid email address." };
    }

    return email;
  }

  function validatePassword(value) {
    const password = String(value || "");

    if (!password) {
      throw { code: "PASSWORD_REQUIRED", message: "Enter your password." };
    }

    if (password.length < 8) {
      throw {
        code: "PASSWORD_TOO_SHORT",
        message: "Password must be at least 8 characters."
      };
    }

    return password;
  }

  function validatePasswordConfirmation(password, confirmation) {
    if (String(password || "") !== String(confirmation || "")) {
      throw {
        code: "PASSWORD_MISMATCH",
        message: "Passwords do not match."
      };
    }
  }

  function setVerification(email, expiresInSeconds) {
    state.verification = {
      email: normalizeEmail(email),
      expiresAt: Date.now() + Math.max(0, Number(expiresInSeconds) || 0) * 1000
    };

    emit();
  }

  async function login(email, password) {
    const normalizedEmail = validateEmail(email);
    const normalizedPassword = validatePassword(password);

    return execute(
      "login",
      () => request("/api/auth/login", {
        identifier: normalizedEmail,
        password: normalizedPassword
      }),
      { validate: function () {} }
    );
  }

  async function register(payload) {
    const data = payload || {};

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const email = validateEmail(data.email);
    const dateOfBirth = String(data.dateOfBirth || "").trim();
    const gender = String(data.gender || "").trim();
    const password = validatePassword(data.password);

    if (!firstName) {
      throw { code: "FIRST_NAME_REQUIRED", message: "Enter your first name." };
    }

    if (!lastName) {
      throw { code: "LAST_NAME_REQUIRED", message: "Enter your last name." };
    }

    if (!dateOfBirth) {
      throw { code: "DOB_REQUIRED", message: "Enter your date of birth." };
    }

    if (!gender) {
      throw { code: "GENDER_REQUIRED", message: "Select your gender." };
    }

    return execute(
      "register",
      async function () {
        const result = await request("/api/auth/register", {
          firstName,
          lastName,
          email,
          gender,
          dateOfBirth,
          password
        });

        if (result.data?.verificationRequired) {
          setVerification(
            email,
            result.data.expiresInSeconds
          );
        }

        return result;
      }
    );
  }

  async function verifyAccount(email, code) {
    const normalizedEmail = validateEmail(email);
    const normalizedCode = String(code || "").trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw {
        code: "VERIFICATION_CODE_INVALID",
        message: "Enter the 6-digit verification code."
      };
    }

    return execute(
      "verify-account",
      async function () {
        return request("/api/auth/verify-account", {
          email: normalizedEmail,
          code: normalizedCode
        });
      }
    );
  }

  async function loadCurrentUser() {
    let loadingHandle = null;

    if (window.ContinueLoading?.start) {
      loadingHandle = window.ContinueLoading.start({
        id: "auth-session-restore",
        context: "auth",
        message: "Restoring your session…",
        delay: 120
      });
    }

    try {
      const result = await request("/api/auth/me", undefined, {
        method: "GET"
      });

      const user = result?.data?.user || null;

      state.user = user;

      if (user) {
        window.currentUser = user;
        window.MIIMIID_CURRENT_USER = user;
      }

      emit();
      return user;
    } finally {
      if (loadingHandle && window.ContinueLoading?.stop) {
        window.ContinueLoading.stop(loadingHandle);
      }
    }
  }

  async function logout() {
    return execute(
      "logout",
      async function () {
        return request("/api/auth/logout", {});
      }
    ).finally(function () {
      state.user = null;
      window.currentUser = null;
      window.MIIMIID_CURRENT_USER = null;
      finish();
    });
  }

  const engine = Object.freeze({
    STATES,
    MODES,
    REGISTRATION_STEPS,
    getState: cloneState,
    subscribe,
    setMode,
    setRegistrationStep,
    execute,
    finish,
    request,
    normalizeEmail,
    normalizeError,
    validateEmail,
    validatePassword,
    validatePasswordConfirmation,
    login,
    register,
    verifyAccount,
    loadCurrentUser,
    logout
  });

  window.MIIMIID_AUTH_ENGINE = engine;
})(window);
