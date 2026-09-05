const { test, expect } = require('@playwright/test');

test.describe('Miimiid browser smoke', () => {
  test('serves the branded landing page', async ({ page }) => {
    const response = await page.goto('/');

    expect(response).not.toBeNull();
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/Miimiid/i);
    await expect(page.locator('body')).toContainText('Miimiid');
  });

  test('live health endpoint is reachable from the browser', async ({ request }) => {
    const response = await request.get('/api/health/live');

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();

    const body = await response.json();
    expect(body).toEqual({
      status: 'OK',
      message: 'Miimiid is alive.'
    });
  });

  test('serves critical PWA and auth assets', async ({ request }) => {
    for (const asset of ['/manifest.json', '/continue-loading.js', '/miimiid-auth-engine.js', '/auth-bootstrap-guard.js']) {
      const response = await request.get(asset);
      expect(response.status(), `${asset} should be served`).toBe(200);
    }
  });
});
