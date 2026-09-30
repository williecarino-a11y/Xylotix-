const { test } = require('@playwright/test');

test('diagnostic: startup trace', async ({ page }) => {
  const out = [];

  await page.addInitScript(() => {
    window.__log = [];
    const log = (m) => window.__log.push(m);
    const orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      if (type === 'DOMContentLoaded' && typeof fn === 'function') {
        const name = fn.name || 'anon';
        log('register DCL ' + name + ' readyState=' + document.readyState);
        const wrapped = function () {
          log('run DCL ' + name);
          try {
            const r = fn.apply(this, arguments);
            if (r && r.catch) r.catch((e) => log('async-reject ' + name + ': ' + e));
            return r;
          } catch (e) {
            log('THROW ' + name + ': ' + e);
            throw e;
          }
        };
        return orig.call(this, type, wrapped, opts);
      }
      return orig.call(this, type, fn, opts);
    };
    orig.call(document, 'DOMContentLoaded', () => log('DOMContentLoaded fired'));
    orig.call(window, 'load', () => log('window load fired'));
    orig.call(window, 'error', (e) => log('ERR ' + e.message + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno));
    orig.call(window, 'unhandledrejection', (e) => log('REJ ' + (e.reason && e.reason.message || e.reason)));
  });

  page.on('pageerror', (e) => out.push('PAGEERROR ' + e.message));
  page.on('requestfailed', (r) => out.push('REQFAILED ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) out.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.route('**/api/auth/me', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ status: 'error' }) }));

  await page.goto('/');
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => ({
    log: window.__log,
    authInit: typeof miimiidAuthInitialized !== 'undefined' ? miimiidAuthInitialized : 'undeclared',
    initFn: typeof initializeMiimiidApplication,
    readyState: document.readyState
  }));
  out.push('STATE ' + JSON.stringify(state, null, 1));

  throw new Error('DIAG2 RESULT\n' + out.join('\n'));
});
