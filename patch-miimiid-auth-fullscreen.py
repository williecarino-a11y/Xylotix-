from pathlib import Path

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# ============================================================
# 1. Replace authentication CSS
# ============================================================

old_css_start = text.index("    .miimiid-auth-view {")
old_css_end = text.index("    .miimiid-auth-user {", old_css_start)

new_css = r'''    .miimiid-auth-view {
      position: relative;
      width: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      margin: 0;
      padding:
        max(28px, env(safe-area-inset-top))
        max(24px, env(safe-area-inset-right))
        max(28px, env(safe-area-inset-bottom))
        max(24px, env(safe-area-inset-left));
      box-sizing: border-box;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-x: hidden;
      isolation: isolate;
      background:
        radial-gradient(
          circle at 50% -10%,
          rgba(56, 189, 248, 0.14),
          transparent 42%
        ),
        linear-gradient(
          180deg,
          #07111f 0%,
          #0b1627 52%,
          #07111f 100%
        );
    }

    .miimiid-auth-view::before {
      content: "";
      position: absolute;
      width: 280px;
      height: 280px;
      top: -150px;
      right: -120px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.08);
      filter: blur(60px);
      pointer-events: none;
      z-index: -1;
    }

    .miimiid-auth-view::after {
      content: "";
      position: absolute;
      width: 240px;
      height: 240px;
      bottom: -140px;
      left: -120px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.07);
      filter: blur(60px);
      pointer-events: none;
      z-index: -1;
    }

    .miimiid-auth-card {
      width: min(100%, 430px);
      margin: 0 auto;
      padding: clamp(28px, 7vw, 48px) 0 24px;
      box-sizing: border-box;
      background: transparent;
      border: 0;
      border-radius: 0;
      box-shadow: none;
      animation: miimiidAuthEnter 420ms ease-out both;
    }

    .miimiid-auth-brand {
      display: flex;
      justify-content: center;
      margin: 2px 0 42px;
    }

    .miimiid-auth-brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 54px;
      height: 54px;
      padding: 0 16px;
      border-radius: 17px;
      background: linear-gradient(
        135deg,
        #38bdf8,
        #6366f1
      );
      color: #ffffff;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      box-shadow:
        0 12px 30px rgba(56, 189, 248, 0.18);
    }

    .miimiid-auth-heading {
      margin: 0 0 9px;
      color: #f8fafc;
      font-size: clamp(1.9rem, 7vw, 2.35rem);
      line-height: 1.08;
      letter-spacing: -0.045em;
      font-weight: 750;
      text-align: left;
    }

    .miimiid-auth-subheading {
      margin: 0;
      color: #94a3b8;
      font-size: 1rem;
      line-height: 1.55;
      font-weight: 400;
      text-align: left;
    }

    .miimiid-auth-status {
      min-height: 0;
      margin-top: 16px;
      color: #cbd5e1;
      font-size: 0.94rem;
      line-height: 1.45;
    }

    .miimiid-auth-form {
      margin-top: 30px;
    }

    .miimiid-auth-field {
      margin-bottom: 16px;
    }

    .miimiid-auth-field label {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .miimiid-auth-field input {
      width: 100%;
      min-height: 54px;
      padding: 0 17px;
      box-sizing: border-box;
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(15, 23, 42, 0.72);
      color: #f8fafc;
      font-size: 1rem;
      font-family: inherit;
      transition:
        border-color 180ms ease,
        background 180ms ease,
        box-shadow 180ms ease,
        transform 180ms ease;
    }

    .miimiid-auth-field input::placeholder {
      color: #64748b;
      opacity: 1;
    }

    .miimiid-auth-field input:hover {
      border-color: rgba(148, 163, 184, 0.34);
    }

    .miimiid-auth-field input:focus {
      outline: none;
      border-color: rgba(56, 189, 248, 0.72);
      background: rgba(15, 23, 42, 0.92);
      box-shadow:
        0 0 0 3px rgba(56, 189, 248, 0.10);
    }

    .miimiid-auth-password-wrap {
      position: relative;
      width: 100%;
    }

    .miimiid-auth-password-wrap input {
      padding-right: 56px;
    }

    .miimiid-password-toggle {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      width: 38px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      border-radius: 10px;
      line-height: 1;
      transition:
        color 160ms ease,
        background 160ms ease,
        transform 160ms ease;
    }

    .miimiid-password-toggle:hover {
      color: #cbd5e1;
      background: rgba(148, 163, 184, 0.08);
    }

    .miimiid-password-toggle:active {
      transform: translateY(-50%) scale(0.94);
    }

    .miimiid-password-toggle:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 1px;
    }

    .miimiid-password-toggle svg {
      width: 19px;
      height: 19px;
      pointer-events: none;
    }

    .miimiid-auth-primary {
      width: 100%;
      min-height: 54px;
      margin-top: 8px;
      border-radius: 14px;
      border: 0;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      cursor: pointer;
      transition:
        transform 160ms ease,
        box-shadow 180ms ease,
        filter 180ms ease;
    }

    .miimiid-auth-primary:hover {
      filter: brightness(1.04);
      box-shadow:
        0 10px 26px rgba(56, 189, 248, 0.16);
    }

    .miimiid-auth-primary:active {
      transform: scale(0.985);
    }

    .miimiid-auth-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      margin-top: 20px;
    }

    .miimiid-auth-link {
      min-height: 38px;
      background: none;
      border: none;
      color: #38bdf8;
      cursor: pointer;
      padding: 7px 4px;
      font-size: 0.95rem;
      font-weight: 650;
      font-family: inherit;
      transition:
        color 160ms ease,
        opacity 160ms ease;
    }

    .miimiid-auth-link:hover {
      color: #7dd3fc;
      text-decoration: none;
    }

    .miimiid-auth-link:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 3px;
      border-radius: 6px;
    }

    .miimiid-auth-secondary {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 18px;
    }

    .miimiid-auth-secondary .miimiid-auth-link {
      color: #94a3b8;
    }

    .miimiid-auth-secondary .miimiid-auth-link strong {
      color: #38bdf8;
      font-weight: 700;
    }

    .miimiid-auth-loading {
      width: min(100%, 430px);
      min-height: 100vh;
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      color: #38bdf8;
      font-weight: 650;
      text-align: center;
    }

    .miimiid-auth-user {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 15px;
    }

    .miimiid-auth-user-name {
      font-weight: bold;
    }

    .miimiid-logout-btn {
      width: auto;
      margin-top: 0;
    }

    @keyframes miimiidAuthEnter {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 700px) {
      .miimiid-auth-view {
        align-items: center;
      }

      .miimiid-auth-card {
        padding-top: 32px;
        padding-bottom: 32px;
      }

      .miimiid-auth-brand {
        margin-bottom: 46px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .miimiid-auth-card,
      .miimiid-auth-field input,
      .miimiid-password-toggle,
      .miimiid-auth-primary,
      .miimiid-auth-link {
        animation: none;
        transition: none;
      }
    }

'''

text = text[:old_css_start] + new_css + text[old_css_end:]

# ============================================================
# 2. Make auth markup translation-driven
# ============================================================

replacements = {
    '''      <h1 id="miimiid-auth-title">Welcome to Miimiid</h1>

      <p id="miimiid-auth-subtitle">
        Sign in to continue learning.
      </p>''':
    '''      <div class="miimiid-auth-brand" aria-hidden="true">
        <span class="miimiid-auth-brand-mark">Miimiid</span>
      </div>

      <h1 id="miimiid-auth-title" class="miimiid-auth-heading"></h1>

      <p
        id="miimiid-auth-subtitle"
        class="miimiid-auth-subheading"
      ></p>''',

    '''      Checking your Miimiid session...''':
    '''      <span data-miimiid-auth-key="authCheckingSession"></span>''',

    '''          <label for="miimiid-login-identifier">
            Email or phone number
          </label>''':
    '''          <label
            for="miimiid-login-identifier"
            data-miimiid-auth-key="authEmailOrPhone"
          ></label>''',

    '''          <label for="miimiid-login-password">
            Password
          </label>''':
    '''          <label
            for="miimiid-login-password"
            data-miimiid-auth-key="authPassword"
          ></label>''',

    '''              aria-label="Show password"''':
    '''              aria-label=""''',

    '''          Sign In
        </button>''':
    '''          <span data-miimiid-auth-key="authSignIn"></span>
        </button>''',

    '''            Create an account
          </button>''':
    '''            <span data-miimiid-auth-key="authCreateAccountLink"></span>
          </button>''',

    '''            Forgot password?
          </button>''':
    '''            <span data-miimiid-auth-key="authForgotPassword"></span>
          </button>''',

    '''          <label for="miimiid-register-name">
            Name
          </label>''':
    '''          <label
            for="miimiid-register-name"
            data-miimiid-auth-key="authName"
          ></label>''',

    '''          <label for="miimiid-register-email">
            Email
          </label>''':
    '''          <label
            for="miimiid-register-email"
            data-miimiid-auth-key="authEmail"
          ></label>''',

    '''          <label for="miimiid-register-phone">
            Phone number
          </label>''':
    '''          <label
            for="miimiid-register-phone"
            data-miimiid-auth-key="authPhone"
          ></label>''',

    '''          <label for="miimiid-register-password">
            Password
          </label>''':
    '''          <label
            for="miimiid-register-password"
            data-miimiid-auth-key="authPassword"
          ></label>''',

    '''          <label for="miimiid-register-confirm">
            Confirm password
          </label>''':
    '''          <label
            for="miimiid-register-confirm"
            data-miimiid-auth-key="authConfirmPassword"
          ></label>''',

    '''          Create Account
        </button>''':
    '''          <span data-miimiid-auth-key="authCreateAccount"></span>
        </button>''',

    '''          Back to sign in
        </button>''':
    '''          <span data-miimiid-auth-key="authBackToSignIn"></span>
        </button>''',

    '''          <label for="miimiid-forgot-identifier">
            Email address
          </label>''':
    '''          <label
            for="miimiid-forgot-identifier"
            data-miimiid-auth-key="authEmailAddress"
          ></label>''',

    '''          Send Reset Instructions
        </button>''':
    '''          <span data-miimiid-auth-key="authSendResetInstructions"></span>
        </button>''',

    '''          <label for="miimiid-reset-password">
            New password
          </label>''':
    '''          <label
            for="miimiid-reset-password"
            data-miimiid-auth-key="authNewPassword"
          ></label>''',

    '''          <label for="miimiid-reset-confirm">
            Confirm new password
          </label>''':
    '''          <label
            for="miimiid-reset-confirm"
            data-miimiid-auth-key="authConfirmNewPassword"
          ></label>''',

    '''          Reset Password
        </button>''':
    '''          <span data-miimiid-auth-key="authResetPasswordAction"></span>
        </button>'''
}

for old, new in replacements.items():
    if old not in text:
        raise SystemExit(f"Required markup fragment not found:\n{old}")
    text = text.replace(old, new, 1)

# ============================================================
# 3. Add placeholders dynamically through data attributes.
# ============================================================

placeholder_replacements = {
    'id="miimiid-login-identifier"\n            type="text"':
    'id="miimiid-login-identifier"\n            type="text"\n            data-miimiid-auth-placeholder="authEmailOrPhone"',

    'id="miimiid-login-password"\n              type="password"':
    'id="miimiid-login-password"\n              type="password"\n              data-miimiid-auth-placeholder="authPassword"',

    'id="miimiid-register-name"\n            type="text"':
    'id="miimiid-register-name"\n            type="text"\n            data-miimiid-auth-placeholder="authName"',

    'id="miimiid-register-email"\n            type="email"':
    'id="miimiid-register-email"\n            type="email"\n            data-miimiid-auth-placeholder="authEmail"',

    'id="miimiid-register-phone"\n            type="tel"':
    'id="miimiid-register-phone"\n            type="tel"\n            data-miimiid-auth-placeholder="authPhone"',

    'id="miimiid-register-password"\n              type="password"':
    'id="miimiid-register-password"\n              type="password"\n              data-miimiid-auth-placeholder="authPassword"',

    'id="miimiid-register-confirm"\n              type="password"':
    'id="miimiid-register-confirm"\n              type="password"\n              data-miimiid-auth-placeholder="authConfirmPassword"',

    'id="miimiid-forgot-identifier"\n            type="email"':
    'id="miimiid-forgot-identifier"\n            type="email"\n            data-miimiid-auth-placeholder="authEmailAddress"',

    'id="miimiid-reset-password"\n              type="password"':
    'id="miimiid-reset-password"\n              type="password"\n              data-miimiid-auth-placeholder="authNewPassword"',

    'id="miimiid-reset-confirm"\n              type="password"':
    'id="miimiid-reset-confirm"\n              type="password"\n              data-miimiid-auth-placeholder="authConfirmNewPassword"'
}

for old, new in placeholder_replacements.items():
    if old not in text:
        raise SystemExit(f"Required input fragment not found:\n{old}")
    text = text.replace(old, new, 1)

# ============================================================
# 4. Add translation keys to English dictionary only.
#    Existing resolver supplies English fallback for other
#    languages until those keys are fully localized.
# ============================================================

english_anchor = "    en: {\n"
english_insert = """      authCheckingSession: 'Checking your Miimiid session...',
      authEmailOrPhone: 'Email or phone number',
      authEmailAddress: 'Email address',
      authEmail: 'Email',
      authPhone: 'Phone number',
      authName: 'Name',
      authPassword: 'Password',
      authNewPassword: 'New password',
      authConfirmPassword: 'Confirm password',
      authConfirmNewPassword: 'Confirm new password',
      authSignIn: 'Sign In',
      authCreateAccountLink: 'Create an account',
      authForgotPassword: 'Forgot password?',
      authCreateAccount: 'Create Account',
      authBackToSignIn: 'Back to sign in',
      authSendResetInstructions: 'Send Reset Instructions',
      authResetPasswordAction: 'Reset Password',
      authShowPassword: 'Show password',
      authHidePassword: 'Hide password',
"""
if english_anchor not in text:
    raise SystemExit("English translation dictionary anchor not found.")

if "authCheckingSession:" not in text:
    text = text.replace(
        english_anchor,
        english_anchor + english_insert,
        1
    )

# ============================================================
# 5. Add a data-driven auth translation renderer.
# ============================================================

renderer_anchor = '''    function showMiimiidAuthMode(mode) {
'''

if renderer_anchor not in text:
    raise SystemExit("showMiimiidAuthMode anchor not found.")

renderer = r'''    function applyMiimiidAuthTranslations() {
      const translate =
        key => miimiidDashboardTranslate(key);

      document
        .querySelectorAll("[data-miimiid-auth-key]")
        .forEach(element => {
          const key =
            element.getAttribute(
              "data-miimiid-auth-key"
            );

          if (key) {
            element.textContent = translate(key);
          }
        });

      document
        .querySelectorAll("[data-miimiid-auth-placeholder]")
        .forEach(input => {
          const key =
            input.getAttribute(
              "data-miimiid-auth-placeholder"
            );

          if (key) {
            input.placeholder = translate(key);
          }
        });

      document
        .querySelectorAll(".miimiid-password-toggle")
        .forEach(toggle => {
          const targetId =
            toggle.getAttribute(
              "data-password-target"
            );

          const target =
            targetId
              ? document.getElementById(targetId)
              : null;

          const visible =
            target &&
            target.type === "text";

          const label =
            translate(
              visible
                ? "authHidePassword"
                : "authShowPassword"
            );

          toggle.setAttribute(
            "aria-label",
            label
          );

          toggle.setAttribute(
            "title",
            label
          );

          toggle.setAttribute(
            "aria-pressed",
            visible ? "true" : "false"
          );
        });
    }

'''

text = text.replace(
    renderer_anchor,
    renderer + renderer_anchor,
    1
)

# ============================================================
# 6. Ensure the auth mode renderer applies translations.
# ============================================================

status_anchor = '''      setMiimiidAuthStatus("");
    }
'''

if status_anchor not in text:
    raise SystemExit("Auth status reset anchor not found.")

text = text.replace(
    status_anchor,
    '''      applyMiimiidAuthTranslations();

      setMiimiidAuthStatus("");
    }
''',
    1
)

# ============================================================
# 7. Ensure password toggle refreshes localized aria labels.
# ============================================================

toggle_anchor = '''      input.type =
        input.type === "password"
          ? "text"
          : "password";
'''

if toggle_anchor not in text:
    raise SystemExit("Password toggle anchor not found.")

text = text.replace(
    toggle_anchor,
    toggle_anchor + '''
      applyMiimiidAuthTranslations();
''',
    1
)

# ============================================================
# 8. Ensure language changes immediately refresh auth copy.
# ============================================================

language_event_anchor = '''  document.addEventListener(
    "miimiidLanguageChanged",
'''

if language_event_anchor in text:
    # Insert a lightweight listener before the existing listener.
    text = text.replace(
        language_event_anchor,
        '''  document.addEventListener(
    "miimiidLanguageChanged",
    () => {
      applyMiimiidAuthTranslations();
    }
  );

''' + language_event_anchor,
        1
    )

# ============================================================
# 9. Add primary auth class to existing submit buttons.
# ============================================================

for button_id in [
    "miimiid-login-submit",
    "miimiid-register-submit",
    "miimiid-forgot-submit",
    "miimiid-reset-submit"
]:
    marker = f'id="{button_id}"\n        >'
    if marker in text:
        text = text.replace(
            marker,
            f'id="{button_id}"\n          class="btn miimiid-auth-primary"\n        >',
            1
        )
    else:
        # Existing class may already be on the same opening tag.
        old = f'class="btn"\n          id="{button_id}"'
        new = f'class="btn miimiid-auth-primary"\n          id="{button_id}"'
        if old in text:
            text = text.replace(old, new, 1)
        else:
            raise SystemExit(
                f"Could not locate submit button: {button_id}"
            )

# ============================================================
# 10. Remove duplicate .btn class if replacement created one.
# ============================================================

text = text.replace(
    'class="btn"\n          class="btn miimiid-auth-primary"',
    'class="btn miimiid-auth-primary"'
)

path.write_text(text, encoding="utf-8")
print("Miimiid full-screen authentication patch applied.")
