from pathlib import Path

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Add the missing English authentication translations.
# ------------------------------------------------------------
anchor = "      settings: 'Settings',\n"

auth_translations = """      settings: 'Settings',

      authWelcome: 'Welcome back',
      authSignInSubtitle: 'Sign in to continue to your account.',
      authCreateAccount: 'Create an account',
      authCreateSubtitle: 'Create your Miimiid account to get started.',
      authResetPassword: 'Reset your password',
      authResetSubtitle: 'Choose a new password for your Miimiid account.',
      authResetTitle: 'Reset your password',
      authResetDescription: 'Choose a new password for your Miimiid account.',
      authEmailOrPhone: 'Email or phone number',
      authPassword: 'Password',
      authSignIn: 'Sign In',
      authForgotPassword: 'Forgot password?',
      authCreateAccountLink: 'Create an account',
      authBackToSignIn: 'Back to sign in',
      authShowPassword: 'Show password',
      authHidePassword: 'Hide password',
      authNewPassword: 'New password',
      authConfirmNewPassword: 'Confirm new password',
      authConfirmPassword: 'Confirm password',
      authName: 'Name',
      authEmail: 'Email',
      authPhoneNumber: 'Phone number',
      authCreateAccountButton: 'Create Account',
      authSendResetInstructions: 'Send Reset Instructions',
      authResetPasswordButton: 'Reset Password',
      authPasswordsDoNotMatch: 'Passwords do not match.',
      authCreatingAccount: 'Creating your account...',
      authAccountCreated: 'Account created successfully.',
      authUnableToSignIn: 'Unable to sign in.',
      authUnableToCreateAccount: 'Unable to create your account.',
"""

if "authWelcome: 'Welcome back'" not in text:
    if anchor not in text:
        raise SystemExit("ERROR: Translation anchor not found.")
    text = text.replace(anchor, auth_translations, 1)

# ------------------------------------------------------------
# 2. Use translation keys for reset title/subtitle.
# ------------------------------------------------------------
text = text.replace(
    '          title.textContent = "Reset your password";',
    '          title.textContent =\\n            miimiidDashboardTranslate("authResetTitle");',
    1
)

text = text.replace(
    '''          subtitle.textContent =
            "Choose a new password for your Miimiid account.";''',
    '''          subtitle.textContent =
            miimiidDashboardTranslate("authResetDescription");''',
    1
)

# ------------------------------------------------------------
# 3. Replace visible password emoji controls with SVG icons.
# ------------------------------------------------------------
eye_open = '''<svg
              class="miimiid-password-icon miimiid-password-icon-show"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6S2.25 12 2.25 12Z"
              />
              <circle cx="12" cy="12" r="2.75" />
            </svg>'''

eye_closed = '''<svg
              class="miimiid-password-icon miimiid-password-icon-hide"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M3 3l18 18"
              />
              <path
                d="M10.58 10.58a2 2 0 0 0 2.83 2.83"
              />
              <path
                d="M9.88 5.2A10.9 10.9 0 0 1 12 5c6.25 0 9.75 7 9.75 7a17.8 17.8 0 0 1-3.07 3.82"
              />
              <path
                d="M6.61 6.61C4.05 8.14 2.25 12 2.25 12s3.5 7 9.75 7a10.8 10.8 0 0 0 4.12-.8"
              />
            </svg>'''

# Replace the five emoji contents while preserving the button structure.
text = text.replace(
    '            👁',
    eye_open,
)

# ------------------------------------------------------------
# 4. Add icon CSS.
# ------------------------------------------------------------
css_anchor = '''    .miimiid-password-toggle:hover,
    .miimiid-password-toggle:focus-visible {
'''

icon_css = '''    .miimiid-password-icon {
      width: 20px;
      height: 20px;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    .miimiid-password-icon-hide {
      display: none;
    }

'''

if ".miimiid-password-icon {" not in text:
    if css_anchor not in text:
        raise SystemExit("ERROR: Password toggle CSS anchor not found.")
    text = text.replace(css_anchor, icon_css + css_anchor, 1)

# ------------------------------------------------------------
# 5. Replace password toggle runtime with icon-state updates.
# ------------------------------------------------------------
old_runtime = '''            toggle.textContent =
              showing ? "👁" : "🙈";

            toggle.setAttribute(
              "aria-label",
              showing
                ? "Show password"
                : "Hide password"
            );
'''

new_runtime = '''            const showIcon =
              toggle.querySelector(
                ".miimiid-password-icon-show"
              );

            const hideIcon =
              toggle.querySelector(
                ".miimiid-password-icon-hide"
              );

            if (showIcon) {
              showIcon.style.display =
                showing ? "block" : "none";
            }

            if (hideIcon) {
              hideIcon.style.display =
                showing ? "none" : "block";
            }

            toggle.setAttribute(
              "aria-label",
              miimiidDashboardTranslate(
                showing
                  ? "authShowPassword"
                  : "authHidePassword"
              )
            );
'''

if old_runtime not in text:
    raise SystemExit("ERROR: Existing password toggle runtime not found.")

text = text.replace(old_runtime, new_runtime, 1)

# ------------------------------------------------------------
# 6. Change existing password-toggle ARIA labels to localized
#    runtime-controlled labels. The runtime will immediately
#    establish the correct label during initialization.
# ------------------------------------------------------------
text = text.replace(
    'aria-label="Show password"',
    'aria-label="Show password"',
)

path.write_text(text, encoding="utf-8")
print("Miimiid authentication foundation patch applied.")
