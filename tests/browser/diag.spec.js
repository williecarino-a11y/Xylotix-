const { test } = require('@playwright/test');

test('diagnostic: served page and auth wiring', async ({ page, request }) => {
  const out = [];
  const res = await request.get('/');
  const html = await res.text();
  out.push('html length ' + html.length);
  for (const c of [
    'function handleMiimiidLogin',
    'function initializeMiimiidAuth',
    'function initializeMiimiidPasswordToggles',
    'function showMiimiidAuthMode',
    'function initializeMiimiidApplication',
    'function miimiidTranslate'
  ]) {
    out.push(c + ' = ' + html.includes(c));
  }

  page.on('pageerror', e => out.push('PAGEERROR ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') out.push('CONSOLE-ERROR ' + m.text().slice(0, 150));
  });
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
  out.push('BEFORE ' + JSON.stringify(before));

  await page.locator('#miimiid-show-register').click();
  await page.waitForTimeout(1500);

  const after = await page.evaluate(() => {
    const chain = [];
    let n = document.getElementById('miimiid-register-get-started');
    while (n && n !== document.body) {
      chain.push(n.tagName + '#' + n.id + '.' + n.className);
      n = n.parentElement;
    }
    return {
      loginForm: document.getElementById('miimiid-login-form')?.className,
      registerForm: document.getElementById('miimiid-register-form')?.className,
      chain
    };
  });
  out.push('AFTER ' + JSON.stringify(after));

  throw new Error('DIAG RESULT\n' + out.join('\n'));
});
