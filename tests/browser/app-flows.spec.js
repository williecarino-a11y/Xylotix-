const { test, expect } = require('@playwright/test');

test.describe('Miimiid browser application flows', () => {
  test('exposes the registration flow and advances through the first steps', async ({ page }) => {
    await page.goto('/');

    const start = page.locator('#miimiid-register-get-started');
    await expect(start).toBeVisible();
    await start.click();

    await expect(page.locator('#miimiid-register-first-name')).toBeVisible();
    await expect(page.locator('#miimiid-register-last-name')).toBeVisible();

    await page.locator('#miimiid-register-first-name').fill('Browser');
    await page.locator('#miimiid-register-last-name').fill('Test');
    await page.locator('#miimiid-register-name-next').click();

    await expect(page.locator('#miimiid-register-email')).toBeVisible();
  });

  test('exposes the login form with accessible credentials and submit controls', async ({ page }) => {
    await page.goto('/');

    const login = page.locator('#miimiid-login-form');
    await expect(login).toBeAttached();
    await expect(page.locator('#miimiid-login-identifier')).toHaveAttribute('type', 'email');
    await expect(page.locator('#miimiid-login-password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#miimiid-login-submit')).toBeAttached();
  });

  test('Fun Center games endpoint returns server-owned game data', async ({ request }) => {
    const response = await request.get('/api/fun-center/games');

    expect(response.status()).toBe(200);
    await expect(response).toBeOK();

    const body = await response.json();
    expect(body.status).toBe('success');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);

    for (const game of body.data) {
      expect(game.id).toEqual(expect.any(String));
      expect(game.title).toEqual(expect.any(String));
      expect(Array.isArray(game.rounds)).toBe(true);
      expect(game.rounds.length).toBeGreaterThan(0);
      expect(game.rounds[0]).not.toHaveProperty('answer');
      expect(game.rounds[0]).not.toHaveProperty('correctAnswer');
    }
  });

  test('AI Tutor protects the chat endpoint when unauthenticated', async ({ request }) => {
    const response = await request.post('/api/ai-tutor/chat', {
      data: { message: 'Hello tutor' }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({
      success: false,
      code: 'AI_TUTOR_AUTH_REQUIRED'
    });
  });

  test('Fun Center session creation requires authentication', async ({ request }) => {
    const response = await request.post('/api/fun-center/session', {
      data: { gameId: 'money-match' }
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toMatchObject({
      status: 'error',
      message: 'Authentication required.'
    });
  });
});
