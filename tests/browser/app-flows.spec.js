const { test, expect } = require('@playwright/test');

test.describe('Miimiid browser application flows', () => {
  test('exposes the registration flow and advances through the first steps', async ({ page }) => {
    await page.goto('/');

    const showRegister = page.locator('#miimiid-show-register');
    await expect(showRegister).toBeVisible();
    await showRegister.click();

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
              id: 'browser-e2e-user',
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
          data: { message: 'A budget is a plan for how you will use your money.' }
        })
      });
    });

    await page.goto('/');

    // The production shell is bootstrapped by deferred scripts. Wait for the
    // auth engine itself before forcing the same session restore the bootstrap
    // guard performs, which avoids racing DOMContentLoaded in CI.
    await page.waitForFunction(() => Boolean(window.MIIMIID_AUTH_ENGINE), null, { timeout: 10000 });
    await page.evaluate(() => window.MIIMIID_AUTH_ENGINE.loadCurrentUser());
    await page.waitForFunction(
      () => window.MIIMIID_AUTH_ENGINE?.getState?.().sessionStatus === 'authenticated',
      null,
      { timeout: 10000 }
    );

    const appShell = page.locator('#miimiid-app-shell');
    await expect(appShell).toBeAttached();
    await expect(appShell).not.toHaveClass(/\bhidden\b/);

    const dashboard = page.locator('.miimiid-dashboard.active');
    await expect(dashboard).toBeAttached();
    await expect(dashboard).toHaveClass(/\bactive\b/);

    const dashboardViews = await page.locator('[data-dashboard-view]').evaluateAll(buttons =>
      buttons.map(button => button.getAttribute('data-dashboard-view')).filter(Boolean)
    );
    expect(dashboardViews).toEqual(expect.arrayContaining(['aiTutor', 'funCenter']));

    await page.locator('[data-dashboard-view="aiTutor"]').first().click();
    await expect(page.locator('.miimiid-ai-tutor-view')).toBeVisible();

    const tutorInput = page.locator('.miimiid-ai-tutor-input').first();
    if (await tutorInput.count()) {
      await tutorInput.fill('What is a budget?');
      const tutorForm = page.locator('.miimiid-ai-tutor-form').first();
      await tutorForm.locator('button[type="submit"]').click();
      await expect(page.locator('.miimiid-ai-tutor-message').filter({ hasText: 'budget' }).last()).toBeVisible();
    }

    await page.locator('[data-dashboard-view="funCenter"]').first().click();
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
