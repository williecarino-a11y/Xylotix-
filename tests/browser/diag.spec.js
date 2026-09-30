const { test } = require('@playwright/test');

test('diagnostic: which init function runs', async ({ page }) => {
  const out = [];
  page.on('pageerror', (e) => out.push('PAGEERROR ' + e.message));
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ status: 'error' }) }));
  await page.goto('/');
  await page.waitForTimeout(3000);

  const info = await page.evaluate(async () => {
    const r = {};
    r.appFn = typeof initializeMiimiidApplication === 'function'
      ? String(initializeMiimiidApplication).slice(0, 350) : 'missing';
    r.authFn = typeof initializeMiimiidAuth === 'function'
      ? String(initializeMiimiidAuth).slice(0, 350) : 'missing';
    r.before = miimiidAuthInitialized;
    try {
      initializeMiimiidAuth();
      r.afterManualCall = miimiidAuthInitialized;
    } catch (e) {
      r.manualCallThrew = String(e);
    }
    r.filesMentioningIt = [];
    const srcs = Array.from(document.scripts).map((s) => s.src).filter(Boolean);
    for (const s of srcs) {
      try {
        const t = await (await fetch(s)).text();
        if (t.includes('initializeMiimiidAuth')) r.filesMentioningIt.push(s.split('/').pop());
      } catch (e) {}
    }
    return r;
  });

  out.push(JSON.stringify(info, null, 1));
  throw new Error('DIAG3 RESULT\n' + out.join('\n'));
});
