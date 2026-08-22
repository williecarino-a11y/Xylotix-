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

icons = show + "\n            " + hide

# Remove every previously inserted Miimiid password icon.
icon_pattern = re.compile(
    r'\s*<svg\s+'
    r'class="miimiid-password-icon[^"]*"\s+'
    r'viewBox="0 0 24 24"'
    r'.*?</svg>',
    re.DOTALL
)

text, removed = icon_pattern.subn("", text)

# Locate the five existing password toggle buttons.
button_pattern = re.compile(
    r'(<button\s+'
    r'type="button"\s+'
    r'class="miimiid-password-toggle"\s+'
    r'data-password-toggle="[^"]+"\s+'
    r'aria-label="[^"]*"\s+'
    r'aria-pressed="false"\s*>)'
    r'(.*?)'
    r'(</button>)',
    re.DOTALL
)

matches = list(button_pattern.finditer(text))

if len(matches) != 5:
    raise SystemExit(
        f"ERROR: Expected 5 password toggle buttons, found {len(matches)}. "
        "No password icon changes were written."
    )

# Replace only the inside of each password toggle.
def rebuild(match):
    opening = match.group(1)
    closing = match.group(3)
    return opening + "\n" + icons + "\n          " + closing

text, replaced = button_pattern.subn(rebuild, text)

if replaced != 5:
    raise SystemExit(
        f"ERROR: Expected to rebuild 5 password buttons, rebuilt {replaced}."
    )

path.write_text(text, encoding="utf-8")

print(f"Removed {removed} old SVG icon blocks.")
print(f"Rebuilt {replaced} password visibility controls.")
