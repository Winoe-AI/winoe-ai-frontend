import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_CREATED_TRIAL_ID, QA_PAGE_BUDGETS } from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';
import { TrialCreateQaPage } from './pages';

test.describe('TalentPartner Create Trial Flows', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('create trial form validates required fields', async ({ page }) => {
    await installTalentPartnerApiMocks(page);
    const createPage = new TrialCreateQaPage(page);

    await createPage.gotoCreate();

    await expect(page).toHaveURL('/dashboard/trials/new');
    await expect(
      page.getByRole('heading', { name: /new trial/i }),
    ).toBeVisible();

    await createPage.submitCreate();

    await expect(page.getByText(/title is required\./i)).toBeVisible();
    await expect(page).toHaveURL('/dashboard/trials/new');
  });

  test('create trial submits and navigates to detail page within budget @perf', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page, {
      trialId: QA_CREATED_TRIAL_ID,
      createTrialId: QA_CREATED_TRIAL_ID,
    });
    const createPage = new TrialCreateQaPage(page);

    // Warm create/detail routes before perf timing to avoid compile-time skew.
    await createPage.gotoCreate();
    await page.goto(`/dashboard/trials/${QA_CREATED_TRIAL_ID}`);
    await expect(page.getByText(/5-day trial plan/i)).toBeVisible();
    await createPage.gotoCreate();

    const startMs = Date.now();
    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/trials') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await createPage.fillTitle('QA Trial: Frontend Platform Flow');
    await page.getByLabel(/^role$/i).fill('Senior Frontend Engineer');
    await page.getByLabel(/tech stack/i).fill('TypeScript + Next.js');

    await createPage.submitCreate();
    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);
    await expect(page).toHaveURL(`/dashboard/trials/${QA_CREATED_TRIAL_ID}`);
    await expect(page.getByText(/5-day trial plan/i)).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:create-trial-flow-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.trialDetailMs);
  });
});
