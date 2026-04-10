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
    test.use({ storageState: storageStates.talentPartnerOnly });

    test('landing page renders signed-in shell with dashboard entry point', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page).toHaveURL('/');
      await expect(
        page.getByRole('heading', { name: /welcome back/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /go to dashboard/i }),
      ).toHaveAttribute('href', '/dashboard');
      await expect(
        page.getByRole('link', { name: /candidate portal/i }),
      ).toHaveAttribute('href', '/candidate/dashboard');
    });
  });
});
