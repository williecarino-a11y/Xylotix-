from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

show = '''<svg
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

hide = '''<svg
              class="miimiid-password-icon miimiid-password-icon-hide"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
              <path d="M9.88 5.2A10.9 10.9 0 0 1 12 5c6.25 0 9.75 7 9.75 7a17.8 17.8 0 0 1-3.07 3.82" />
              <path d="M6.61 6.61C4.05 8.14 2.25 12 2.25 12s3.5 7 9.75 7a10.8 10.8 0 0 0 4.12-.8" />
            </svg>'''

icon_markup = show + "\n            " + hide

pattern = re.compile(
    r'(<button\s+'
    r'type="button"\s+'
    r'class="miimiid-password-toggle"\s+'
    r'data-password-toggle="[^"]+"\s+'
    r'aria-label="[^"]*"\s+'
    r'aria-pressed="false"\s*>\s*)'
    r'.*?'
    r'(\s*</button>)',
    re.DOTALL
)

matches = list(pattern.finditer(text))

if len(matches) != 5:
    raise SystemExit(
        f"ERROR: Expected exactly 5 password toggle buttons, found {len(matches)}."
    )

text, replaced = pattern.subn(
    lambda m: m.group(1) + icon_markup + m.group(2),
    text
)

if replaced != 5:
    raise SystemExit(
        f"ERROR: Expected to normalize 5 buttons, normalized {replaced}."
    )

path.write_text(text, encoding="utf-8")

print("Normalized all 5 Miimiid password visibility controls.")
