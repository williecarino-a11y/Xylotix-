const { test, expect } = require('@playwright/test');

const authenticatedUser = {
  id: '507f1f77bcf86cd799439011',
  firstName: 'Browser',
  lastName: 'Auth',
  name: 'Browser Auth',
  email: 'browser-auth@example.com',
  gender: 'unspecified',
  dateOfBirth: '1990-01-01',
  emailVerified: true,
  accountVerified: true
};

async function mockAuthenticatedSession(page, options = {}) {
  const { dashboardStatus = 200 } = options;

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        data: { user: authenticatedUser }
      })
    });
  });

  await page.route('**/api/learn/dashboard/**', async route => {
    await route.fulfill({
      status: dashboardStatus,
      contentType: 'application/json',
      body: dashboardStatus === 200
        ? JSON.stringify({
            status: 'success',
            data: {
              totalXP: 120,
              streak: 4,
              totalLessonsCompleted: 6,
              averageQuizScore: 88
            }
          })
        : JSON.stringify({
            status: 'error',
            code: 'DASHBOARD_UNAVAILABLE',
            message: 'Dashboard unavailable.'
          })
    });
  });
}

test.describe('Miimiid authentication bootstrap', () => {
  test('unauthenticated bootstrap resolves to the login view and hides the app shell', async ({ page }) => {
    let authMeCalls = 0;

    await page.route('**/api/auth/me', async route => {
      authMeCalls += 1;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required.'
        })
      });
    });

    await page.goto('/');

    await expect(page.locator('#miimiid-auth-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#miimiid-app-shell')).toBeHidden();
    await expect.poll(() => authMeCalls).toBe(1);

    await expect(page.locator('#miimiid-auth-loading')).toBeHidden();
  });

  test('authenticated bootstrap initializes the dashboard before exposing the app shell', async ({ page }) => {
    await mockAuthenticatedSession(page);

    await page.goto('/');

    await expect(page.locator('#miimiid-app-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#miimiid-auth-view')).toBeHidden();
    await expect(page.locator('.miimiid-dashboard.active')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('.miimiid-dashboard-brand')).toContainText('Miimiid');
  });

  test('authenticated bootstrap fails closed to login when dashboard initialization fails', async ({ page }) => {
    await mockAuthenticatedSession(page, { dashboardStatus: 500 });

    await page.goto('/');

    await expect(page.locator('#miimiid-auth-card')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#miimiid-app-shell')).toBeHidden();
    await expect(page.locator('#miimiid-auth-loading')).toBeHidden();
  });

  test('logout returns the browser from the authenticated shell to the login view', async ({ page }) => {
    await mockAuthenticatedSession(page);

    await page.route('**/api/auth/logout', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: { loggedOut: true }
        })
      });
    });

    await page.goto('/');
    await expect(page.locator('#miimiid-app-shell')).toBeVisible({ timeout: 15000 });

    await page.evaluate(() => window.MIIMIID_AUTH_ENGINE.logout());

    await expect(page.locator('#miimiid-auth-card')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#miimiid-app-shell')).toBeHidden();
  });
});
