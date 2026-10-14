/*
 * Miimiid - "Continue with Google" (front end).
 *
 * - Fetches the public Google Client ID from /api/auth/google-config.
 *   If none is configured, nothing is shown.
 * - Adds a Google button under Sign in and on the first Create Account step.
 * - New people get a short "date of birth + gender" screen (18+ rule).
 *
 * Reuses the page's existing helpers: setMiimiidAuthStatus,
 * getMiimiidAsyncButton, showMiimiidAuthMode, miimiidSafeAuthMessage,
 * initializeMiimiidDashboard.
 */
(function () {
  "use strict";

  var PROFILE_FORM_ID = "miimiid-google-profile-form";
  var PROFILE_MODE = "googleprofile";
  var GSI_URL = "https://accounts.google.com/gsi/client";

  var pendingCredential = "";

  /* ---------- helpers ---------- */

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

  async function runWithButton(element, work) {
    var controller = null;
    try {
      if (typeof getMiimiidAsyncButton === "function") {
        controller = getMiimiidAsyncButton(element);
      }
    } catch (error) {}

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

  function goToMode(mode) {
    if (typeof window.showMiimiidAuthMode === "function") {
      window.showMiimiidAuthMode(mode);
    }
  }

  async function callGoogleAuth(payload) {
    var response = await fetch("/api/auth/google", {
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

  /* ---------- after Google responds ---------- */

  async function finishSignIn(result, credential) {
    var data = result.data || {};

    if (data.profileRequired) {
      pendingCredential = credential;
      showProfileScreen(data);
      return;
    }

    var user = data.user;
    if (!user) throw new Error("");

    pendingCredential = "";
    window.currentUser = user;
    window.MIIMIID_CURRENT_USER = user;
    try {
      miimiidCurrentUser = user;
    } catch (error) {}

    setStatus("");

    if (typeof initializeMiimiidDashboard === "function") {
      await initializeMiimiidDashboard();
    } else {
      window.location.reload();
    }
  }

  async function handleCredential(response) {
    var credential = response && response.credential;
    if (!credential) return;

    setStatus("");

    try {
      var result = await callGoogleAuth({ credential: credential });
      await finishSignIn(result, credential);
    } catch (error) {
      console.error("Miimiid Google sign-in error:", error);
      setStatus(
        friendlyError(error, t("authGoogleFailed", "Unable to sign in with Google. Please try again.")),
        "error"
      );
    }
  }

  /* ---------- profile screen for new people ---------- */

  function buildProfileForm() {
    var existing = document.getElementById(PROFILE_FORM_ID);
    if (existing) return existing;

    var resetForm = document.getElementById("miimiid-reset-form");
    if (!resetForm || !resetForm.parentNode) return null;

    var form = document.createElement("form");
    form.id = PROFILE_FORM_ID;
    form.className = "miimiid-auth-form hidden";
    form.setAttribute("novalidate", "");
    form.innerHTML =
      '<div class="miimiid-auth-field">' +
        '<p class="miimiid-auth-help" id="miimiid-google-profile-intro"></p>' +
      "</div>" +
      '<div class="miimiid-auth-field">' +
        '<label for="miimiid-google-dob" id="miimiid-google-dob-label"></label>' +
        '<input id="miimiid-google-dob" type="date" autocomplete="bday">' +
      "</div>" +
      '<div class="miimiid-auth-field">' +
        '<label for="miimiid-google-gender" id="miimiid-google-gender-label"></label>' +
        '<select id="miimiid-google-gender"></select>' +
      "</div>" +
      '<button type="submit" class="btn" id="miimiid-google-profile-submit"></button>' +
      '<button type="button" class="miimiid-auth-link" id="miimiid-google-profile-cancel"></button>';

    resetForm.parentNode.insertBefore(form, resetForm.nextSibling);

    document.getElementById("miimiid-google-dob-label").textContent =
      t("authDateOfBirth", "Date of birth");
    document.getElementById("miimiid-google-gender-label").textContent =
      t("authGender", "Gender");
    document.getElementById("miimiid-google-profile-submit").textContent =
      t("authContinue", "Continue");
    document.getElementById("miimiid-google-profile-cancel").textContent =
      t("authBackToSignIn", "Back to sign in");

    var dob = document.getElementById("miimiid-google-dob");
    dob.max = new Date().toISOString().slice(0, 10);
    dob.min = "1900-01-01";

    var select = document.getElementById("miimiid-google-gender");
    var options = [
      { value: "", label: t("authSelectGender", "Select"), disabled: true },
      { value: "male", label: t("authGenderMale", "Male") },
      { value: "female", label: t("authGenderFemale", "Female") }
    ];
    options.forEach(function (item) {
      var option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      if (item.disabled) {
        option.disabled = true;
        option.selected = true;
      }
      select.appendChild(option);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitProfile();
    });

    document
      .getElementById("miimiid-google-profile-cancel")
      .addEventListener("click", function () {
        pendingCredential = "";
        goToMode("login");
      });

    return form;
  }

  function showProfileScreen(data) {
    var form = buildProfileForm();
    if (!form) return;

    var name = (data && data.firstName) || "";
    var intro = document.getElementById("miimiid-google-profile-intro");
    if (intro) {
      intro.textContent =
        (name ? t("authGoogleWelcome", "Welcome") + ", " + name + ". " : "") +
        t(
          "authGoogleProfileIntro",
          "Add your date of birth and gender to finish creating your account."
        );
    }

    goToMode(PROFILE_MODE);
  }

  function ageOf(isoDate) {
    var parts = isoDate.split("-").map(Number);
    var today = new Date();
    var age = today.getFullYear() - parts[0];
    if (
      today.getMonth() + 1 < parts[1] ||
      (today.getMonth() + 1 === parts[1] && today.getDate() < parts[2])
    ) {
      age -= 1;
    }
    return age;
  }

  async function submitProfile() {
    var dob = document.getElementById("miimiid-google-dob");
    var select = document.getElementById("miimiid-google-gender");
    var submit = document.getElementById("miimiid-google-profile-submit");

    var dateOfBirth = dob ? dob.value : "";
    var gender = select ? select.value : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      setStatus(t("authEnterDateOfBirth", "Enter your date of birth."), "error");
      return;
    }
    if (ageOf(dateOfBirth) < 18) {
      setStatus(
        t("authAgeRequirement", "You must be at least 18 years old to create a Miimiid account."),
        "error"
      );
      return;
    }
    if (!gender) {
      setStatus(t("authSelectYourGender", "Select your gender."), "error");
      return;
    }
    if (!pendingCredential) {
      setStatus(
        t("authGoogleSessionMissing", "Your Google sign-in expired. Please start again."),
        "error"
      );
      return;
    }

    setStatus(t("authCreatingAccount", "Creating your account..."));

    await runWithButton(submit, async function () {
      try {
        var result = await callGoogleAuth({
          credential: pendingCredential,
          dateOfBirth: dateOfBirth,
          gender: gender
        });
        await finishSignIn(result, pendingCredential);
      } catch (error) {
        console.error("Miimiid Google profile error:", error);
        setStatus(
          friendlyError(error, t("authGoogleFailed", "Unable to sign in with Google. Please try again.")),
          "error"
        );
      }
    });
  }

  /* ---------- keep the screen switcher in sync ---------- */

  function installModeHook() {
    var original = window.showMiimiidAuthMode;
    if (typeof original !== "function" || original.__googleHook) return;

    var hooked = function (mode) {
      var output = original.apply(this, arguments);
      var form = document.getElementById(PROFILE_FORM_ID);

      if (form) {
        var show = mode === PROFILE_MODE;
        form.classList.toggle("hidden", !show);

        if (show) {
          var title = document.getElementById("miimiid-auth-title");
          var subtitle = document.getElementById("miimiid-auth-subtitle");
          if (title) {
            title.classList.remove("hidden");
            title.textContent = t("authGoogleProfileTitle", "Almost there");
          }
          if (subtitle) {
            subtitle.classList.add("hidden");
          }
        }
      }

      return output;
    };

    hooked.__googleHook = true;
    window.showMiimiidAuthMode = hooked;
  }

  /* ---------- Google button ---------- */

  function injectStyles() {
    if (document.getElementById("miimiid-google-styles")) return;
    var style = document.createElement("style");
    style.id = "miimiid-google-styles";
    style.textContent =
      ".miimiid-google-block{margin-top:18px;text-align:center}" +
      ".miimiid-google-divider{display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:.85rem;margin-bottom:12px}" +
      '.miimiid-google-divider::before,.miimiid-google-divider::after{content:"";flex:1;height:1px;background:#334155}' +
      ".miimiid-google-button{display:flex;justify-content:center;min-height:44px}" +
      "#" + PROFILE_FORM_ID + " select{width:100%;padding:12px;border-radius:7px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:1rem;box-sizing:border-box}" +
      "#" + PROFILE_FORM_ID + " input[type=date]{color-scheme:dark;box-sizing:border-box}";
    document.head.appendChild(style);
  }

  function loadGoogleScript() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        resolve();
        return;
      }
      var script = document.createElement("script");
      script.src = GSI_URL;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function mountButton(container) {
    if (!container || container.querySelector(".miimiid-google-block")) return;

    var block = document.createElement("div");
    block.className = "miimiid-google-block";

    var divider = document.createElement("div");
    divider.className = "miimiid-google-divider";
    divider.textContent = t("authOr", "or");

    var holder = document.createElement("div");
    holder.className = "miimiid-google-button";

    block.appendChild(divider);
    block.appendChild(holder);
    container.appendChild(block);

    window.google.accounts.id.renderButton(holder, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "continue_with",
      logo_alignment: "left",
      width: 280
    });
  }

  async function setupGoogleButtons() {
    var clientId = null;

    try {
      var response = await fetch("/api/auth/google-config", {
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "X-Continue-Loading": "false"
        }
      });
      var result = await response.json();
      clientId = result && result.data ? result.data.clientId : null;
    } catch (error) {
      return;
    }

    if (!clientId) return;

    try {
      await loadGoogleScript();
    } catch (error) {
      console.warn("Google sign-in script could not be loaded.", error);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      itp_support: true
    });

    injectStyles();

    mountButton(document.getElementById("miimiid-login-form"));
    mountButton(
      document.querySelector('#miimiid-register-form [data-register-step="1"]')
    );
  }

  /* ---------- start ---------- */

  function init() {
    buildProfileForm();
    installModeHook();
    injectStyles();
    setupGoogleButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
        
