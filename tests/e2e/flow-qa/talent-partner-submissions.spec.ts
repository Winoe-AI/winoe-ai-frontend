import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_TRIAL_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';

test.describe('TalentPartner Candidate Submissions Flows', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('submissions page renders artifacts and supports list expansion @perf', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page);

    // Warm the route once so perf timing reflects runtime behavior, not compile cost.
    await page.goto(
      `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );
    await expect(
      page.getByRole('heading', { name: /submissions/i }),
    ).toBeVisible();

    const startMs = Date.now();
    const submissionsResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/submissions?') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.reload();
    const submissionsResponse = await submissionsResponsePromise;

    expect(submissionsResponse.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: /submissions/i }),
    ).toBeVisible();
    await expect(page.getByText(/latest github artifacts/i)).toBeVisible();
    await expect(page.getByText(/day 4 handoff evidence/i)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /workflow run/i }).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: /show all/i }).click();
    await expect(page.getByText(/all submissions/i).first()).toBeVisible();
    await expect(page.getByText(/showing 1–4/i)).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:submissions-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.trialDetailMs);
  });

  test('winoe report route renders ready report and returns to submissions', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page);

    await page.goto(
      `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );

    const winoeReportPath = `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/winoe-report`;
    await expect(
      page.locator(`a[href="${winoeReportPath}"]`).first(),
    ).toBeVisible();
    await page.goto(winoeReportPath);

    await expect(page).toHaveURL(winoeReportPath);
    await expect(
      page.getByRole('heading', { name: /^winoe report$/i }),
    ).toBeVisible();
    await expect(page.getByText(/overall winoe score/i)).toBeVisible();

    await page.getByRole('link', { name: /back to submissions/i }).click();
    await expect(page).toHaveURL(
      `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );
  });
});
