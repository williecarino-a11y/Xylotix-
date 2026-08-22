function setMiimiidAuthStatus(message, type = "") {
      const status =
        document.getElementById("miimiid-auth-status");

      if (!status) {
        return;
      }

      status.textContent = message || "";
      status.className =
        "miimiid-auth-status" +
        (type ? ` ${type}-text` : "");
    }

    function applyMiimiidAuthTranslations() {
      const authElements =
        document.querySelectorAll(
          "[data-miimiid-auth-key]"
        );

      authElements.forEach((element) => {
        const key =
          element.getAttribute(
            "data-miimiid-auth-key"
          );

        if (!key) {
          return;
        }

        element.textContent =
          miimiidDashboardTranslate(key);
      });

      const authLoading =
        document.getElementById(
          "miimiid-auth-loading"
        );

      if (authLoading) {
        authLoading.textContent =
          miimiidDashboardTranslate(
            "authCheckingSession"
          );
      }

      const passwordToggles =
        document.querySelectorAll(
          ".miimiid-password-toggle"
        );

      passwordToggles.forEach((toggle) => {
        const targetId =
          toggle.getAttribute(
            "data-password-target"
          );

        const input =
          document.getElementById(targetId);

        const isVisible =
          input &&
          input.type === "text";

        toggle.setAttribute(
          "aria-label",
          miimiidDashboardTranslate(
            isVisible
              ? "authHidePassword"
              : "authShowPassword"
          )
        );
      });
    }

    function showMiimiidAuthMode(mode) {
      const login =
        document.getElementById("miimiid-login-form");

      const register =
        document.getElementById("miimiid-register-form");

      const forgot =
        document.getElementById("miimiid-forgot-form");

      const reset =
        document.getElementById("miimiid-reset-form");

      const title =
        document.getElementById("miimiid-auth-title");

      const subtitle =
        document.getElementById("miimiid-auth-subtitle");

      if (!login || !register || !forgot || !reset) {
        return;
      }

      login.classList.toggle(
        "hidden",
        mode !== "login"
      );

      register.classList.toggle(
        "hidden",
        mode !== "register"
      );

      forgot.classList.toggle(
        "hidden",
        mode !== "forgot"
      );

      reset.classList.toggle(
        "hidden",
        mode !== "reset"
      );

      if (title) {
        if (mode === "register") {
          title.classList.add("hidden");
        } else {
          title.classList.remove("hidden");

          if (mode === "forgot") {
            title.textContent =
              miimiidDashboardTranslate("authResetPassword");
          } else if (mode === "reset") {
            title.textContent =
              miimiidDashboardTranslate("authResetPasswordTitle");
          } else {
            title.textContent =
              miimiidDashboardTranslate("authWelcome");
          }
        }
      }

      if (subtitle) {
        if (mode === "register") {
          subtitle.classList.add("hidden");
        } else {
          subtitle.classList.remove("hidden");

          if (mode === "forgot") {
            subtitle.textContent =
              miimiidDashboardTranslate("authResetSubtitle");
          } else if (mode === "reset") {
            subtitle.textContent =
              miimiidDashboardTranslate(
                "authResetPasswordSubtitle"
              );
          } else {
            subtitle.textContent =
              miimiidDashboardTranslate(
                "authSignInSubtitle"
              );
          }
        }
      }

      setMiimiidAuthStatus("");
      applyMiimiidAuthTranslations();
    }

    function showMiimiidAuthView() {
      const authView =
        document.getElementById("miimiid-auth-view");

      const authLoading =
        document.getElementById("miimiid-auth-loading");

      const authCard =
        document.getElementById("miimiid-auth-card");

      const appShell =
        document.getElementById("miimiid-app-shell");

      const funCenter =
        document.getElementById("miimiid-fun-center-view");

      const aiTutor =
        document.getElementById("miimiid-ai-tutor-view");

      const courseList =
        document.getElementById("course-list-view");

      const courseDetail =
        document.getElementById("course-detail-view");

      const lessonView =
        document.getElementById("lesson-view");

      if (authView) {
        authView.classList.remove("hidden");
      }

      if (authLoading) {
        authLoading.classList.add("hidden");
      }

      if (authCard) {
        authCard.classList.remove("hidden");
      }

      if (appShell) {
        appShell.classList.add("hidden");
      }

      [
        funCenter,
        aiTutor,
        courseList,
        courseDetail,
        lessonView
      ].forEach(element => {
        if (element) {
          element.classList.add("hidden");
        }
      });

      showMiimiidAuthMode("login");
    }

    function hideMiimiidAuthView() {
      const authView =
        document.getElementById("miimiid-auth-view");

      const appShell =
        document.getElementById("miimiid-app-shell");

      if (authView) {
        authView.classList.add("hidden");
      }

      if (appShell) {
        appShell.classList.remove("hidden");
      }
    }

    async function loadMiimiidCurrentUser() {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              method: "GET",
              credentials: "same-origin",
              headers: {
                "Accept": "application/json"
              }
            }
          );

        if (!response.ok) {
          miimiidCurrentUser = null;
          return null;
        }

        const result =
          await response.json();

        if (
          result &&
          result.status === "success" &&
          result.data &&
          result.data.user
        ) {
          miimiidCurrentUser =
            result.data.user;

          window.currentUser =
            miimiidCurrentUser;

          window.MIIMIID_CURRENT_USER =
            miimiidCurrentUser;

          return miimiidCurrentUser;
        }

        miimiidCurrentUser = null;
        return null;

      } catch (error) {
        console.error(
          "Miimiid authentication check failed:",
          error
        );

        miimiidCurrentUser = null;
        return null;
      }
    }

    function getMiimiidCurrentUserId() {
      const candidates = [
        miimiidCurrentUser,
        window.currentUser,
        window.MIIMIID_CURRENT_USER,
        window.loggedInUser,
        window.user
      ];

      for (const user of candidates) {
        if (
          user &&
          typeof user.id === "string" &&
          /^[a-fA-F0-9]{24}$/.test(user.id)
        ) {
          return user.id;
        }

        if (
          user &&
          typeof user._id === "string" &&
          /^[a-fA-F0-9]{24}$/.test(user._id)
        ) {
          return user._id;
        }
      }

      return null;
    }

    async function miimiidAuthenticate(
      endpoint,
      payload
    ) {
      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

      let result = null;

      try {
        result = await response.json();
      } catch (error) {
        throw new Error(
          "The authentication server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result ||
        result.status !== "success"
      ) {
        throw new Error(
          result &&
          result.message
            ? result.message
            : "Authentication request failed."
        );
      }

      if (
        result.data &&
        result.data.user
      ) {
        miimiidCurrentUser =
          result.data.user;

        window.currentUser =
          miimiidCurrentUser;

        window.MIIMIID_CURRENT_USER =
          miimiidCurrentUser;
      }

      return miimiidCurrentUser;
    }

    async function handleMiimiidLogin(event) {
      event.preventDefault();

      const identifier =
        document
          .getElementById(
            "miimiid-login-identifier"
          )
          ?.value
          .trim();

      const password =
        document
          .getElementById(
            "miimiid-login-password"
          )
          ?.value || "";

      const submit =
        document.getElementById(
          "miimiid-login-submit"
        );

      if (!identifier || !password) {
        setMiimiidAuthStatus(
          "Enter your email or phone number and password.",
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        "Signing in..."
      );

      try {
        await miimiidAuthenticate(
          "/api/auth/login",
          {
            identifier,
            password
          }
        );

        setMiimiidAuthStatus(
          "Signed in successfully.",
          "success"
        );

        hideMiimiidAuthView();

        await initializeMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid login error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          "Unable to sign in.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    let miimiidRegistrationStep = 1;
    let miimiidVerificationEmail = "";
    let miimiidVerificationExpiresAt = 0;
    let miimiidVerificationTimer = null;

    function showMiimiidRegistrationStep(step) {
      const steps =
        document.querySelectorAll(
          "#miimiid-register-form [data-register-step]"
        );

      if (!steps.length) {
        return;
      }

      const requestedStep =
        Math.max(
          1,
          Math.min(
            5,
            Number(step) || 1
          )
        );

      miimiidRegistrationStep =
        requestedStep;

      steps.forEach(section => {
        const sectionStep =
          Number(
            section.getAttribute(
              "data-register-step"
            )
          );

        section.classList.toggle(
          "hidden",
          sectionStep !== requestedStep
        );
      });

      const feedback =
        document.getElementById(
          "miimiid-register-feedback"
        );

      if (feedback) {
        feedback.textContent = "";
        feedback.className =
          "miimiid-auth-feedback";
      }
    }

    function setMiimiidRegisterFeedback(
      message,
      type = ""
    ) {
      const feedback =
        document.getElementById(
          "miimiid-register-feedback"
        );

      if (!feedback) {
        return;
      }

      feedback.textContent =
        message || "";

      feedback.className =
        "miimiid-auth-feedback" +
        (type
          ? ` ${type}`
          : "");
    }

    function clearMiimiidVerificationTimer() {
      if (
        miimiidVerificationTimer
      ) {
        clearInterval(
          miimiidVerificationTimer
        );

        miimiidVerificationTimer =
          null;
      }
    }

    function startMiimiidVerificationTimer(
      expiresInSeconds
    ) {
      clearMiimiidVerificationTimer();

      const expires =
        Number(expiresInSeconds);

      if (
        !Number.isFinite(expires) ||
        expires <= 0
      ) {
        return;
      }

      miimiidVerificationExpiresAt =
        Date.now() +
        expires * 1000;

      const update =
        () => {
          const remaining =
            Math.max(
              0,
              Math.ceil(
                (
                  miimiidVerificationExpiresAt -
                  Date.now()
                ) / 1000
              )
            );

          const minutes =
            Math.floor(
              remaining / 60
            );

          const seconds =
            String(
              remaining % 60
            ).padStart(2, "0");

          const timer =
            document.getElementById(
              "miimiid-verification-timer"
            );

          if (timer) {
            timer.textContent =
              remaining > 0
                ? `Code expires in ${minutes}:${seconds}`
                : "Code expired. Request a new code.";
          }

          if (remaining <= 0) {
            clearMiimiidVerificationTimer();
          }
        };

      update();

      miimiidVerificationTimer =
        setInterval(
          update,
          1000
        );
    }

    function resetMiimiidRegistrationFlow() {
      clearMiimiidVerificationTimer();

      miimiidRegistrationStep =
        1;

      miimiidVerificationEmail =
        "";

      miimiidVerificationExpiresAt =
        0;

      const code =
        document.getElementById(
          "miimiid-register-verification-code"
        );

      if (code) {
        code.value = "";
      }

      setMiimiidRegisterFeedback(
        ""
      );

      showMiimiidRegistrationStep(
        1
      );
    }

    async function handleMiimiidRegister(event) {
      event.preventDefault();

      const firstName =
        document
          .getElementById(
            "miimiid-register-first-name"
          )
          ?.value
          .trim() || "";

      const lastName =
        document
          .getElementById(
            "miimiid-register-last-name"
          )
          ?.value
          .trim() || "";

      const email =
        document
          .getElementById(
            "miimiid-register-email"
          )
          ?.value
          .trim() || "";

      const dateOfBirth =
        document
          .getElementById(
            "miimiid-register-dob"
          )
          ?.value || "";

      const password =
        document
          .getElementById(
            "miimiid-register-password"
          )
          ?.value || "";

      const confirm =
        document
          .getElementById(
            "miimiid-register-confirm"
          )
          ?.value || "";

      if (!firstName) {
        showMiimiidRegistrationStep(2);

        setMiimiidRegisterFeedback(
          "Enter your first name.",
          "error"
        );

        return;
      }

      if (!lastName) {
        showMiimiidRegistrationStep(2);

        setMiimiidRegisterFeedback(
          "Enter your last name.",
          "error"
        );

        return;
      }

      if (!email) {
        showMiimiidRegistrationStep(3);

        setMiimiidRegisterFeedback(
          "Enter your email address.",
          "error"
        );

        return;
      }

      if (!dateOfBirth) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Enter your date of birth.",
          "error"
        );

        return;
      }

      if (password.length < 8) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Password must be at least 8 characters.",
          "error"
        );

        return;
      }

      if (password !== confirm) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Passwords do not match.",
          "error"
        );

        return;
      }

      const submit =
        document.getElementById(
          "miimiid-register-submit"
        );

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Creating your account..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/register",
            {
              firstName,
              lastName,
              email,
              dateOfBirth,
              password
            }
          );

        const data =
          response?.data || {};

        if (
          data.verificationRequired
        ) {
          miimiidVerificationEmail =
            email;

          const verificationEmail =
            document.getElementById(
              "miimiid-verification-email"
            );

          if (verificationEmail) {
            verificationEmail.textContent =
              data.maskedEmail ||
              email;
          }

          const verificationCode =
            document.getElementById(
              "miimiid-register-verification-code"
            );

          if (verificationCode) {
            verificationCode.value = "";
            verificationCode.focus();
          }

          showMiimiidRegistrationStep(
            5
          );

          startMiimiidVerificationTimer(
            data.expiresInSeconds
          );

          return;
        }

        throw new Error(
          "Account verification is required."
        );

      } catch (error) {
        console.error(
          "Miimiid registration error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to create your account.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function handleMiimiidVerifyAccount() {
      const code =
        document
          .getElementById(
            "miimiid-register-verification-code"
          )
          ?.value
          .trim() || "";

      const submit =
        document.getElementById(
          "miimiid-verify-account-submit"
        );

      if (!/^\d{6}$/.test(code)) {
        setMiimiidRegisterFeedback(
          "Enter the 6-digit verification code.",
          "error"
        );

        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Verifying your account..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/verify-account",
            {
              email:
                miimiidVerificationEmail,
              code
            }
          );

        const data =
          response?.data || {};

        if (
          !data.verified
        ) {
          throw new Error(
            "Unable to verify your account."
          );
        }

        clearMiimiidVerificationTimer();

        setMiimiidRegisterFeedback(
          "Account verified successfully.",
          "success"
        );

        hideMiimiidAuthView();

        await initializeMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid account verification error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to verify your account.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function handleMiimiidResendVerification() {
      if (!miimiidVerificationEmail) {
        setMiimiidRegisterFeedback(
          "Your verification session is missing. Please start again.",
          "error"
        );

        return;
      }

      const resend =
        document.getElementById(
          "miimiid-resend-verification"
        );

      if (resend) {
        resend.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Sending a new verification code..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/resend-verification",
            {
              email:
                miimiidVerificationEmail
            }
          );

        const data =
          response?.data || {};

        if (
          data.verified
        ) {
          clearMiimiidVerificationTimer();

          hideMiimiidAuthView();

          await initializeMiimiidDashboard();

          return;
        }

        const verificationEmail =
          document.getElementById(
            "miimiid-verification-email"
          );

        if (verificationEmail) {
          verificationEmail.textContent =
            data.maskedEmail ||
            miimiidVerificationEmail;
        }

        startMiimiidVerificationTimer(
          data.expiresInSeconds
        );

        setMiimiidRegisterFeedback(
          "A new verification code has been sent.",
          "success"
        );

      } catch (error) {
        console.error(
          "Miimiid verification resend error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to send a new verification code.",
          "error"
        );

      } finally {
        if (resend) {
          resend.disabled = false;
        }
      }
    }

    

async function handleMiimiidForgotPassword(event) {
      event.preventDefault();

      const email =
        document
          .getElementById(
            "miimiid-forgot-identifier"
          )
          ?.value
          .trim();

      const submit =
        document.getElementById(
          "miimiid-forgot-submit"
        );

      if (!email) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authEnterEmail"),
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        miimiidDashboardTranslate("authSendingResetInstructions")
      );

      try {
        const response =
          await fetch(
            "/api/auth/forgot-password",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                email
              })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result ||
          result.status !== "success"
        ) {
          throw new Error(
            result &&
            result.message
              ? result.message
              : miimiidDashboardTranslate("authRequestResetError")
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          miimiidDashboardTranslate("authResetInstructionsSent"),
          "success"
        );

      } catch (error) {
        console.error(
          "Miimiid password reset request error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          miimiidDashboardTranslate("authRequestResetError"),
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }


    async function handleMiimiidResetPassword(event) {
      event.preventDefault();

      const token =
        new URLSearchParams(window.location.search)
          .get("resetToken");

      const password =
        document
          .getElementById("miimiid-reset-password")
          ?.value || "";

      const confirmPassword =
        document
          .getElementById("miimiid-reset-confirm")
          ?.value || "";

      const submit =
        document.getElementById("miimiid-reset-submit");

      if (!token) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authInvalidResetLink"),
          "error"
        );
        return;
      }

      if (password.length < 8) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authPasswordMinLength"),
          "error"
        );
        return;
      }

      if (password !== confirmPassword) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authPasswordMismatch"),
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        miimiidDashboardTranslate("authResettingPassword")
      );

      try {
        const response =
          await fetch(
            "/api/auth/reset-password",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                token,
                password
              })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result ||
          result.status !== "success"
        ) {
          throw new Error(
            result &&
            result.message
              ? result.message
              : miimiidDashboardTranslate("authResetPasswordError")
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          miimiidDashboardTranslate("authPasswordResetSuccess"),
          "success"
        );

        const resetForm =
          document.getElementById(
            "miimiid-reset-form"
          );

        if (resetForm) {
          resetForm.reset();
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        window.setTimeout(
          () => showMiimiidAuthMode("login"),
          900
        );

      } catch (error) {
        console.error(
          "Miimiid reset password error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          miimiidDashboardTranslate("authResetPasswordError"),
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function logoutMiimiid() {
      try {
        const response =
          await fetch(
            "/api/auth/logout",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Accept": "application/json"
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            "Logout request failed."
          );
        }

      } catch (error) {
        console.error(
          "Miimiid logout error:",
          error
        );
      } finally {
        miimiidCurrentUser = null;

        window.currentUser = null;
        window.MIIMIID_CURRENT_USER = null;

        currentCourseId = null;
        currentLessonId = null;
        courseDataCache = null;

        showMiimiidAuthView();
      }
    }

    function initializeMiimiidPasswordToggles() {
      const toggles =
        document.querySelectorAll(
          ".miimiid-password-toggle"
        );

      toggles.forEach((toggle) => {
        toggle.addEventListener(
          "click",
          () => {
            const targetId =
              toggle.getAttribute(
                "data-password-target"
              );

            const input =
              document.getElementById(targetId);

            if (!input) {
              return;
            }

            const isVisible =
              input.type === "text";

            input.type =
              isVisible ? "password" : "text";

            toggle.setAttribute(
              "aria-pressed",
              String(!isVisible)
            );

            toggle.setAttribute(
              "aria-label",
              miimiidDashboardTranslate(
                isVisible
                  ? "authShowPassword"
                  : "authHidePassword"
              )
            );

            toggle.innerHTML =
              isVisible
                ? `${eyeHiddenIcon()}`
                : `${eyeVisibleIcon()}`;
          }
        );
      });
    }

    const MIIMIID_EYE_HIDDEN_SVG = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;

    const MIIMIID_EYE_VISIBLE_SVG = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-3.1 4.4"></path>
        <path d="M6.1 6.1C3.5 8.2 2 12 2 12s3.5 8 10 8c1.3 0 2.5-.3 3.6-.7"></path>
      </svg>
    `;

    function eyeHiddenIcon() {
      return MIIMIID_EYE_HIDDEN_SVG;
    }

    function eyeVisibleIcon() {
      return MIIMIID_EYE_VISIBLE_SVG;
    }

    function initializeMiimiidRegistrationFlow() {
      const form =
        document.getElementById(
          "miimiid-register-form"
        );

      if (!form) {
        return;
      }

      if (
        form.dataset.registrationInitialized ===
        "true"
      ) {
        return;
      }

      form.dataset.registrationInitialized =
        "true";

      document
        .getElementById(
          "miimiid-register-get-started"
        )
        ?.addEventListener(
          "click",
          () => {
            showMiimiidRegistrationStep(2);
          }
        );

      document
        .getElementById(
          "miimiid-register-name-next"
        )
        ?.addEventListener(
          "click",
          () => {
            const firstName =
              document
                .getElementById(
                  "miimiid-register-first-name"
                )
                ?.value
                .trim() || "";

            const lastName =
              document
                .getElementById(
                  "miimiid-register-last-name"
                )
                ?.value
                .trim() || "";

            if (!firstName) {
              setMiimiidRegisterFeedback(
                "Enter your first name.",
                "error"
              );
              return;
            }

            if (!lastName) {
              setMiimiidRegisterFeedback(
                "Enter your last name.",
                "error"
              );
              return;
            }

            showMiimiidRegistrationStep(3);
          }
        );

      document
        .getElementById(
          "miimiid-register-contact-next"
        )
        ?.addEventListener(
          "click",
          () => {
            const email =
              document
                .getElementById(
                  "miimiid-register-email"
                )
                ?.value
                .trim() || "";

            if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
              )
            ) {
              setMiimiidRegisterFeedback(
                "Enter a valid email address.",
                "error"
              );
              return;
            }

            showMiimiidRegistrationStep(4);
          }
        );

      document
        .getElementById(
          "miimiid-register-submit"
        )
        ?.addEventListener(
          "click",
          () => {
            const formEvent =
              new Event(
                "submit",
                {
                  bubbles: true,
                  cancelable: true
                }
              );

            form.dispatchEvent(
              formEvent
            );
          }
        );

      document
        .getElementById(
          "miimiid-verify-account-submit"
        )
        ?.addEventListener(
          "click",
          handleMiimiidVerifyAccount
        );

      document
        .getElementById(
          "miimiid-resend-verification"
        )
        ?.addEventListener(
          "click",
          handleMiimiidResendVerification
        );

      form
        .querySelectorAll(
          "[data-register-back]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              const target =
                Number(
                  button.getAttribute(
                    "data-register-back"
                  )
                );

              showMiimiidRegistrationStep(
                target
              );
            }
          );
        });
    }


    

function initializeMiimiidAuth() {
      if (miimiidAuthInitialized) {
        return;
      }

      miimiidAuthInitialized = true;

      initializeMiimiidPasswordToggles();
      applyMiimiidAuthTranslations();

      const loginForm =
        document.getElementById(
          "miimiid-login-form"
        );

      const registerForm =
        document.getElementById(
          "miimiid-register-form"
        );

      const forgotForm =
        document.getElementById(
          "miimiid-forgot-form"
        );

      if (loginForm) {
        loginForm.addEventListener(
          "submit",
          handleMiimiidLogin
        );
      }

      if (registerForm) {
        registerForm.addEventListener(
          "submit",
          handleMiimiidRegister
        );
      }

      if (forgotForm) {
        forgotForm.addEventListener(
          "submit",
          handleMiimiidForgotPassword
        );
      }

      const resetForm =
        document.getElementById(
          "miimiid-reset-form"
        );

      if (resetForm) {
        resetForm.addEventListener(
          "submit",
          handleMiimiidResetPassword
        );
      }

      document
        .getElementById("miimiid-show-register")
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("register")
        );

      document
        .getElementById("miimiid-show-forgot")
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("forgot")
        );

      document
        .getElementById(
          "miimiid-show-login-from-register"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );

      document
        .getElementById(
          "miimiid-show-login-from-forgot"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );

      document
        .getElementById(
          "miimiid-show-login-from-reset"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );
    }

    async function initializeMiimiidApplication() {
      initializeMiimiidAuth();

      const authLoading =
        document.getElementById(
          "miimiid-auth-loading"
        );

      const authView =
        document.getElementById(
          "miimiid-auth-view"
        );

      const authCard =
        document.getElementById(
          "miimiid-auth-card"
        );

      const appShell =
        document.getElementById(
          "miimiid-app-shell"
        );

      const miimiidHeader =
        document.querySelector(
          ".miimiid-header"
        );

      const drawerBackdrop =
        document.getElementById(
          "miimiid-drawer-backdrop"
        );

      /*
       * Never expose authenticated application
       * chrome or dashboard data while
       * authentication state is unknown.
       */
      if (appShell) {
        appShell.classList.add("hidden");
      }

      if (miimiidHeader) {
        miimiidHeader.classList.add("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.add("hidden");
      }

      if (authView) {
        authView.classList.remove("hidden");
      }

      if (authLoading) {
        authLoading.classList.remove("hidden");
      }

      if (authCard) {
        authCard.classList.add("hidden");
      }

      const resetToken =
        new URLSearchParams(window.location.search)
          .get("resetToken");

      if (resetToken) {
        showMiimiidAuthView();
        showMiimiidAuthMode("reset");
        return;
      }

      const user =
        await loadMiimiidCurrentUser();

      if (!user) {
        showMiimiidAuthView();
        return;
      }

      if (authView) {
        authView.classList.add("hidden");
      }

      if (appShell) {
        appShell.classList.remove("hidden");
      }

      if (miimiidHeader) {
        miimiidHeader.classList.remove("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.remove("hidden");
      }

      await initializeMiimiidDashboard();
    }


    /* =========================================
       APPLICATION STATE
       ========================================= */

let currentQuizzes = [];
let selectedQuizAnswers = [];
let quizSubmitted = false;
let currentCourseId = null;
let currentLessonId = null;
let currentQuiz = null;
let courseDataCache = null;

    /* =========================================
       FETCH ALL COURSES
       ========================================= */

