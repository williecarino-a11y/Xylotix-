/**
 * Miimiid Authentication Engine
 *
 * Single source of truth for authentication and session state.
 * UI code may render from this state, but must not own authentication state.
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

  const SESSION_STATES = Object.freeze({
    UNKNOWN: "unknown",
    RESTORING: "restoring",
    AUTHENTICATED: "authenticated",
    UNAUTHENTICATED: "unauthenticated",
    EXPIRED: "expired",
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
    sessionStatus: SESSION_STATES.UNKNOWN,
    verification: {
      email: "",
      expiresAt: 0
    }
  };

  const listeners = new Set();
  let activeOperation = null;
  let internalRequestDepth = 0;
  let observerInstalled = false;

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
    if (typeof listener !== "function") return function () {};
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
    setState({ mode, status: STATES.IDLE, action: null, error: null });
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

  function setUser(user, sessionStatus) {
    state.user = user || null;
    state.sessionStatus = sessionStatus ||
      (user ? SESSION_STATES.AUTHENTICATED : SESSION_STATES.UNAUTHENTICATED);

    window.currentUser = state.user;
    window.MIIMIID_CURRENT_USER = state.user;
    emit();
    return cloneState();
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
        message: error.message || fallback || "Authentication request failed.",
        status: error.status
      };
    }

    return {
      code: "AUTH_ERROR",
      message: fallback || "Authentication request failed."
    };
  }

  async function request(endpoint, payload, options) {
    const config = options || {};
    internalRequestDepth += 1;

    try {
      const response = await fetch(endpoint, {
        method: config.method || "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Continue-Loading": "false",
          ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
          ...(config.headers || {})
        },
        body: payload === undefined ? undefined : JSON.stringify(payload),
        signal: config.signal
      });

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      if (!response.ok || !result || result.status !== "success") {
        throw {
          code: result?.code || `HTTP_${response.status}`,
          message: result?.message || "Authentication request failed.",
          status: response.status,
          data: result?.data
        };
      }

      return result;
    } finally {
      internalRequestDepth = Math.max(0, internalRequestDepth - 1);
    }
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

    if (activeOperation) return activeOperation;

    activeOperation = (async function () {
      setState({ action, status: STATES.VALIDATING, error: null });
      let loadingHandle = null;

      try {
        if (typeof options?.validate === "function") {
          await options.validate();
        }

        setState({ action, status: STATES.SUBMITTING, error: null });

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
        const user = result?.data?.user || result?.user || null;

        if (action === "logout") {
          setUser(null, SESSION_STATES.UNAUTHENTICATED);
        } else if (user) {
          setUser(user, SESSION_STATES.AUTHENTICATED);
        }

        setState({
          action: null,
          status: STATES.SUCCESS,
          error: null,
          user: state.user
        });

        return result;
      } catch (error) {
        const normalized = normalizeError(error, "Authentication request failed.");
        setState({ action: null, status: STATES.ERROR, error: normalized });
        throw normalized;
      } finally {
        if (loadingHandle && window.ContinueLoading?.stop) {
          window.ContinueLoading.stop(loadingHandle);
        }
      }
    })();

    try {
      return await activeOperation;
    } finally {
      activeOperation = null;
    }
  }

  function finish() {
    setState({ action: null, status: STATES.IDLE, error: null });
  }

  function validateEmail(value) {
    const email = normalizeEmail(value);
    if (!email) throw { code: "EMAIL_REQUIRED", message: "Enter your email address." };
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw { code: "EMAIL_INVALID", message: "Enter a valid email address." };
    }
    return email;
  }

  function validatePassword(value) {
    const password = String(value || "");
    if (!password) throw { code: "PASSWORD_REQUIRED", message: "Enter your password." };
    if (password.length < 8) {
      throw { code: "PASSWORD_TOO_SHORT", message: "Password must be at least 8 characters." };
    }
    return password;
  }

  function validatePasswordConfirmation(password, confirmation) {
    if (String(password || "") !== String(confirmation || "")) {
      throw { code: "PASSWORD_MISMATCH", message: "Passwords do not match." };
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
    return execute("login", () => request("/api/auth/login", {
      identifier: normalizedEmail,
      password: normalizedPassword
    }));
  }

  async function register(payload) {
    const data = payload || {};
    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const email = validateEmail(data.email);
    const dateOfBirth = String(data.dateOfBirth || "").trim();
    const gender = String(data.gender || "").trim();
    const password = validatePassword(data.password);

    if (!firstName) throw { code: "FIRST_NAME_REQUIRED", message: "Enter your first name." };
    if (!lastName) throw { code: "LAST_NAME_REQUIRED", message: "Enter your last name." };
    if (!dateOfBirth) throw { code: "DOB_REQUIRED", message: "Enter your date of birth." };
    if (!gender) throw { code: "GENDER_REQUIRED", message: "Select your gender." };

    return execute("register", async function () {
      const result = await request("/api/auth/register", {
        firstName, lastName, email, gender, dateOfBirth, password
      });
      if (result.data?.verificationRequired) {
        setVerification(email, result.data.expiresInSeconds);
      }
      return result;
    });
  }

  async function verifyAccount(email, code) {
    const normalizedEmail = validateEmail(email);
    const normalizedCode = String(code || "").trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      throw { code: "VERIFICATION_CODE_INVALID", message: "Enter the 6-digit verification code." };
    }
    return execute("verify-account", () => request("/api/auth/verify-account", {
      email: normalizedEmail,
      code: normalizedCode
    }));
  }

  async function loadCurrentUser() {
    if (activeOperation) return state.user;

    setState({ sessionStatus: SESSION_STATES.RESTORING, error: null });
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
      const result = await request("/api/auth/me", undefined, { method: "GET" });
      const user = result?.data?.user || null;
      setUser(user, user ? SESSION_STATES.AUTHENTICATED : SESSION_STATES.UNAUTHENTICATED);
      setState({ status: STATES.IDLE, action: null, error: null });
      return user;
    } catch (error) {
      const normalized = normalizeError(error, "We could not restore your session.");
      if (normalized.status === 401 || normalized.code === "HTTP_401") {
        setUser(null, SESSION_STATES.UNAUTHENTICATED);
        setState({ status: STATES.IDLE, action: null, error: null });
        return null;
      }
      setUser(null, SESSION_STATES.ERROR);
      setState({ status: STATES.ERROR, action: null, error: normalized });
      throw normalized;
    } finally {
      if (loadingHandle && window.ContinueLoading?.stop) {
        window.ContinueLoading.stop(loadingHandle);
      }
    }
  }

  async function logout() {
    return execute("logout", () => request("/api/auth/logout", {}));
  }

  function installAuthResponseObserver() {
    if (observerInstalled || typeof window.fetch !== "function") return;
    observerInstalled = true;

    const originalFetch = window.fetch.bind(window);
    window.fetch = async function miimiidAuthObservedFetch(input, init) {
      const response = await originalFetch(input, init);

      if (internalRequestDepth > 0) return response;

      const url = typeof input === "string" ? input : input?.url || "";
      if (!url.includes("/api/auth/")) return response;

      try {
        const clone = response.clone();
        const payload = await clone.json();
        const path = new URL(url, window.location.origin).pathname;
        const user = payload?.data?.user || payload?.user || null;

        if (response.ok && payload?.status === "success") {
          if (path.endsWith("/logout")) {
            setUser(null, SESSION_STATES.UNAUTHENTICATED);
          } else if (user) {
            setUser(user, SESSION_STATES.AUTHENTICATED);
          }
        } else if (response.status === 401 && path.endsWith("/me")) {
          setUser(null, SESSION_STATES.UNAUTHENTICATED);
        }
      } catch (_) {
        // Never break the application's original fetch response.
      }

      return response;
    };
  }

  installAuthResponseObserver();

  const engine = Object.freeze({
    STATES,
    SESSION_STATES,
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
