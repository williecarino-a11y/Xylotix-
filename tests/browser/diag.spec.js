const { test } = require('@playwright/test');

test('diagnostic: served page and auth wiring', async ({ page, request }) => {
  const res = await request.get('/');
  const html = await res.text();
  const checks = [
    'function handleMiimiidLogin',
    'function initializeMiimiidAuth',
    'function initializeMiimiidPasswordToggles',
    'function showMiimiidAuthMode',
    'function initializeMiimiidApplication',
    'function miimiidTranslate'
  ];
  console.log('[diag] served html length', html.length);
  for (const c of checks) console.log('[diag]', c, html.includes(c));

  page.on('console', m => console.log('[diag-browser]', m.type(), m.text()));
  page.on('pageerror', e => console.log('[diag-pageerror]', e.message));
  await page.route('**/api/auth/me', r =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ status: 'error' }) }));

  await page.goto('/');
  await page.waitForTimeout(3000);

  const before = await page.evaluate(() => ({
    authInit: typeof miimiidAuthInitialized !== 'undefined' ? miimiidAuthInitialized : 'undeclared',
    showMode: typeof window.showMiimiidAuthMode,
    loginForm: document.getElementById('miimiid-login-form')?.className,
    registerForm: document.getElementById('miimiid-register-form')?.className,
    scripts: Array.from(document.scripts).map(s => s.src || 'inline').join(' | ')
  }));
  console.log('[diag] before click', JSON.stringify(before));

  await page.locator('#miimiid-show-register').click();
  await page.waitForTimeout(1500);

  const after = await page.evaluate(() => {
    const chain = [];
    let n = document.getElementById('miimiid-register-get-started');
    while (n && n !== document.body) { chain.push(n.tagName + '#' + n.id + '.' + n.className); n = n.parentElement; }
    return {
      loginForm: document.getElementById('miimiid-login-form')?.className,
      registerForm: document.getElementById('miimiid-register-form')?.className,
      chain
    };
  });
  console.log('[diag] after register click', JSON.stringify(after));
});
