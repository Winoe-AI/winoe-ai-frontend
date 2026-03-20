import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_PAGE_BUDGETS } from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { MarketingPage } from './pages';

test.describe('Marketing Flows', () => {
  test('landing page renders signed-out state within budget @perf', async ({
    page,
  }) => {
    const marketing = new MarketingPage(page);
    const startMs = Date.now();

    const response = await page.goto('/');

    await expect(page).toHaveURL('/');
    expect(response).not.toBeNull();
    expect(response?.status()).toBe(200);
    await marketing.expectSignedOutHome();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:landing-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.landingMs);
  });

  test.describe('Signed-in marketing shell', () => {
    test.use({ storageState: storageStates.recruiterOnly });

    test('landing page redirects signed-in users to dashboard', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/dashboard');
      await expect(
        page.getByRole('heading', { name: /dashboard/i }),
      ).toBeVisible();
    });
  });
});
