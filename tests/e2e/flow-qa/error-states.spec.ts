import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';

test.describe('Error and Edge State Flows', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('unknown route renders not-found state for authenticated user', async ({
    page,
  }) => {
    const response = await page.goto('/route-that-does-not-exist');

    expect(response).not.toBeNull();
    await expect(page.getByText(/this page could not be found/i)).toBeVisible();
  });

  test.describe('Recruiter dashboard failures', () => {
    test.use({ storageState: storageStates.recruiterOnly });

    test('dashboard shows recoverable error when /api/dashboard fails', async ({
      page,
    }) => {
      let dashboardCallCount = 0;

      await page.route('**/api/dashboard', async (route) => {
        dashboardCallCount += 1;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' }),
        });
      });

      await page.goto('/dashboard');

      await expect(
        page.getByRole('heading', { name: /dashboard/i }),
      ).toBeVisible();
      await expect(page.getByText(/couldn.?t load simulations/i)).toBeVisible();

      await page.getByRole('button', { name: /^retry$/i }).click();
      await expect
        .poll(() => dashboardCallCount, {
          message: 'dashboard retry should trigger a second request',
        })
        .toBeGreaterThan(1);
    });
  });
});
