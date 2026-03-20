import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_SIMULATION_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';

test.describe('Recruiter Candidate Submissions Flows', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('submissions page renders artifacts and supports list expansion @perf', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page);

    // Warm the route once so perf timing reflects runtime behavior, not compile cost.
    await page.goto(
      `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
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
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.simulationDetailMs);
  });

  test('fit profile route renders ready report and returns to submissions', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page);

    await page.goto(
      `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );

    const fitProfilePath = `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/fit-profile`;
    await expect(
      page.locator(`a[href="${fitProfilePath}"]`).first(),
    ).toBeVisible();
    await page.goto(fitProfilePath);

    await expect(page).toHaveURL(fitProfilePath);
    await expect(
      page.getByRole('heading', { name: /^fit profile$/i }),
    ).toBeVisible();
    await expect(page.getByText(/overall fit score/i)).toBeVisible();

    await page.getByRole('link', { name: /back to submissions/i }).click();
    await expect(page).toHaveURL(
      `/dashboard/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );
  });
});
