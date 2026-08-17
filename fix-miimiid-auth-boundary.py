from pathlib import Path

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# 1. Add header/drawer references inside initializeMiimiidApplication()
old = '''      const appShell =
        document.getElementById(
          "miimiid-app-shell"
        );

      /*
       * Never expose dashboard/course data while
       * authentication state is unknown.
       */'''

new = '''      const appShell =
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
       */'''

if old not in text:
    raise SystemExit("STOP: Auth initialization anchor not found.")

text = text.replace(old, new, 1)

# 2. Hide authenticated chrome while auth is unknown
old = '''      if (appShell) {
        appShell.classList.add("hidden");
      }

      if (authView) {'''

new = '''      if (appShell) {
        appShell.classList.add("hidden");
      }

      if (miimiidHeader) {
        miimiidHeader.classList.add("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.add("hidden");
      }

      if (authView) {'''

if old not in text:
    raise SystemExit("STOP: Auth hiding anchor not found.")

text = text.replace(old, new, 1)

# 3. Restore authenticated chrome only after a valid user is confirmed
old = '''      if (appShell) {
        appShell.classList.remove("hidden");
      }

      await initializeMiimiidDashboard();'''

new = '''      if (appShell) {
        appShell.classList.remove("hidden");
      }

      if (miimiidHeader) {
        miimiidHeader.classList.remove("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.remove("hidden");
      }

      await initializeMiimiidDashboard();'''

if old not in text:
    raise SystemExit("STOP: Authenticated restore anchor not found.")

text = text.replace(old, new, 1)

# 4. Make the authentication view a full-screen application surface
old = '''    .miimiid-auth-view {
      max-width: 520px;
      margin: 40px auto;
      padding: 0 10px;
    }'''

new = '''    .miimiid-auth-view {
      width: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    }'''

if old not in text:
    raise SystemExit("STOP: Auth CSS anchor not found.")

text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("AUTH BOUNDARY PATCH: APPLIED")
