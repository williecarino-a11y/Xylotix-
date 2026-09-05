const { test, expect } = require('@playwright/test');

test.describe('Miimiid browser application flows', () => {
  test('exposes the registration flow and advances through the first steps', async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Authentication required.' })
      });
    });

    await page.goto('/');

    const authCard = page.locator('#miimiid-auth-card');
    await expect(authCard).toBeVisible({ timeout: 10000 });

    const showRegister = page.locator('#miimiid-show-register');
    await expect(showRegister).toBeVisible({ timeout: 10000 });
    await showRegister.click();

    const start = page.locator('#miimiid-register-get-started');
    await expect(start).toBeVisible({ timeout: 10000 });
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
    await expect(page.locator('#miimiid-login-identifier')).toHaveAttribute('autocomplete', 'username');
    await expect(page.locator('#miimiid-login-password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#miimiid-login-submit')).toBeAttached();
  });

  test('authenticated browser shell exposes dashboard, AI Tutor, and Fun Center views', async ({ page }) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            user: {
              id: '507f1f77bcf86cd799439011',
              firstName: 'Browser',
              lastName: 'Test',
              name: 'Browser Test',
              email: 'browser-e2e@example.com',
              gender: 'unspecified',
              dateOfBirth: '1990-01-01',
              emailVerified: true,
              accountVerified: true
            }
          }
        })
      });
    });

    await page.route('**/api/learn/dashboard/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            totalXP: 120,
            streak: 4,
            totalLessonsCompleted: 6,
            averageQuizScore: 88
          }
        })
      });
    });

    await page.route('**/api/fun-center/games', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: [{
            id: 'money-match',
            type: 'money-match',
            title: 'Money Match',
            subtitle: 'Browser test game',
            resultTitle: 'Done',
            resultMessage: 'Good work.',
            answers: [{ id: 'needs', label: 'Needs' }, { id: 'wants', label: 'Wants' }],
            rounds: [{
              id: 'browser-round',
              prompt: 'Which category fits?',
              category: 'needs',
              visual: '🧾',
              feedback: 'Correct.',
              choices: [
                { id: 'needs', label: 'Needs' },
                { id: 'wants', label: 'Wants' }
              ]
            }]
          }]
        })
      });
    });

    await page.route('**/api/ai-tutor/chat', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          answer: 'A budget is a plan for how you will use your money.'
        })
      });
    });

    await page.goto('/');

    await page.waitForFunction(() => Boolean(window.MIIMIID_AUTH_ENGINE), null, { timeout: 10000 });
    await page.evaluate(() => window.MIIMIID_AUTH_ENGINE.loadCurrentUser());
    await page.waitForFunction(
      () => window.MIIMIID_AUTH_ENGINE?.getState?.().sessionStatus === 'authenticated',
      null,
      { timeout: 10000 }
    );

    const appShell = page.locator('#miimiid-app-shell');
    await expect(appShell).toBeVisible({ timeout: 15000 });

    const dashboard = page.locator('.miimiid-dashboard.active');
    await expect(dashboard).toBeAttached({ timeout: 15000 });
    await expect(dashboard).toHaveClass(/\bactive\b/);

    const aiTutorNav = page.getByRole('button', { name: 'AI Tutor', exact: true });
    const funCenterNav = page.getByRole('button', { name: 'Fun Center', exact: true });

    await expect(aiTutorNav).toBeVisible({ timeout: 10000 });
    await expect(funCenterNav).toBeVisible({ timeout: 10000 });

    await aiTutorNav.click();
    await expect(page.locator('.miimiid-ai-tutor-view')).toBeVisible();

    const tutorInput = page.locator('.miimiid-ai-tutor-input').first();
    await expect(tutorInput).toBeVisible();
    await tutorInput.fill('What is a budget?');
    await page.locator('.miimiid-ai-tutor-form button[type="submit"]').click();
    await expect(page.locator('.miimiid-ai-tutor-message.assistant').filter({ hasText: 'budget' }).last()).toBeVisible();

    await funCenterNav.click();
    await expect(page.locator('.miimiid-fun-center-view')).toBeVisible();
    await expect(page.locator('.miimiid-money-match')).toBeVisible();
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
