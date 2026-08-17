from pathlib import Path

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")
original = text

# ---------------------------------------------------------
# 1. Add compact password-field wrapper styling.
# ---------------------------------------------------------

css_anchor = '''    .miimiid-auth-field input:focus {
      outline: 2px solid #38bdf8;
      outline-offset: 1px;
    }
'''

css_insert = '''    .miimiid-auth-password-wrap {
      position: relative;
      width: 100%;
    }

    .miimiid-auth-password-wrap input {
      padding-right: 46px;
      box-sizing: border-box;
    }

    .miimiid-password-toggle {
      position: absolute;
      top: 50%;
      right: 10px;
      transform: translateY(-50%);
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 6px;
      line-height: 1;
    }

    .miimiid-password-toggle:hover {
      color: #f8fafc;
      background: rgba(148, 163, 184, 0.12);
    }

    .miimiid-password-toggle:focus-visible {
      outline: 2px solid #38bdf8;
      outline-offset: 1px;
    }

    .miimiid-password-toggle svg {
      width: 20px;
      height: 20px;
      pointer-events: none;
    }
'''

if "miimiid-password-toggle" not in text:
    if css_anchor not in text:
        raise SystemExit("PASSWORD EYE PATCH FAILED: CSS anchor not found.")
    text = text.replace(css_anchor, css_anchor + "\n" + css_insert, 1)

# ---------------------------------------------------------
# 2. Wrap all five password inputs with compact eye buttons.
# ---------------------------------------------------------

fields = [
    ("miimiid-login-password", "Password"),
    ("miimiid-register-password", "Password"),
    ("miimiid-register-confirm", "Confirm password"),
    ("miimiid-reset-password", "New password"),
    ("miimiid-reset-confirm", "Confirm new password"),
]

eye_hidden = '''<svg
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
</svg>'''

eye_visible = '''<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M3 3l18 18"></path>
  <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.3 18.3 0 0 1-3.2 4.2"></path>
  <path d="M6.2 6.2C3.5 8.1 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 3.5-.6"></path>
  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"></path>
</svg>'''

for field_id, label in fields:
    old = f'''          <input
            id="{field_id}"
            type="password"
'''
    new = f'''          <div class="miimiid-auth-password-wrap">
            <input
              id="{field_id}"
              type="password"
'''
    if old in text:
        text = text.replace(old, new, 1)

        # Find the end of this input and insert the eye button.
        marker = f'''            required
          >
        </div>
'''
        start = text.find(f'id="{field_id}"')
        if start == -1:
            raise SystemExit(
                f"PASSWORD EYE PATCH FAILED: {field_id} was not found after wrapping."
            )

        marker_pos = text.find(marker, start)
        if marker_pos == -1:
            raise SystemExit(
                f"PASSWORD EYE PATCH FAILED: input ending not found for {field_id}."
            )

        replacement = f'''            required
            >
            <button
              type="button"
              class="miimiid-password-toggle"
              data-password-target="{field_id}"
              aria-label="Show password"
              aria-pressed="false"
            >
              {eye_hidden}
            </button>
          </div>
        </div>
'''
        text = (
            text[:marker_pos]
            + replacement
            + text[marker_pos + len(marker):]
        )

# ---------------------------------------------------------
# 3. Add one reusable visibility controller.
# ---------------------------------------------------------

js_anchor = '''    function initializeMiimiidAuth() {
      if (miimiidAuthInitialized) {
'''

js_insert = '''    function initializeMiimiidPasswordToggles() {
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
              isVisible
                ? "Show password"
                : "Hide password"
            );

            toggle.innerHTML =
              isVisible
                ? `${eyeHiddenIcon()}`
                : `${eyeVisibleIcon()}`;
          }
        );
      });
    }

    function eyeHiddenIcon() {
      return `${eyeHiddenSvg}`;
    }

    function eyeVisibleIcon() {
      return `${eyeVisibleSvg}`;
    }

    const eyeHiddenSvg = `${eye_hidden}`;
    const eyeVisibleSvg = `${eye_visible}`;

'''

if "function initializeMiimiidPasswordToggles()" not in text:
    if js_anchor not in text:
        raise SystemExit(
            "PASSWORD EYE PATCH FAILED: auth initialization anchor not found."
        )
    text = text.replace(js_anchor, js_insert + js_anchor, 1)

# ---------------------------------------------------------
# 4. Initialize the controls with the existing auth flow.
# ---------------------------------------------------------

init_anchor = '''      miimiidAuthInitialized = true;

      const loginForm =
'''

init_replacement = '''      miimiidAuthInitialized = true;

      initializeMiimiidPasswordToggles();

      const loginForm =
'''

if "initializeMiimiidPasswordToggles();" not in text:
    if init_anchor not in text:
        raise SystemExit(
            "PASSWORD EYE PATCH FAILED: initialization insertion point not found."
        )
    text = text.replace(init_anchor, init_replacement, 1)

# ---------------------------------------------------------
# 5. Verify all five fields and the toggle system exist.
# ---------------------------------------------------------

required = [
    "miimiid-auth-password-wrap",
    "miimiid-password-toggle",
    "miimiid-login-password",
    "miimiid-register-password",
    "miimiid-register-confirm",
    "miimiid-reset-password",
    "miimiid-reset-confirm",
    "initializeMiimiidPasswordToggles();",
]

for item in required:
    if item not in text:
        raise SystemExit(
            f"PASSWORD EYE PATCH FAILED: missing required fragment: {item}"
        )

if text == original:
    raise SystemExit(
        "PASSWORD EYE PATCH FAILED: no changes were made."
    )

path.write_text(text, encoding="utf-8")
print("MIIMIID PASSWORD EYE PATCH: APPLIED")
print("Added compact eye visibility controls to all 5 password fields.")
