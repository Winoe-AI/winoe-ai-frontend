import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_SIMULATION_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';
import { SimulationDetailQaPage } from './pages';

test.describe('Recruiter Simulation Detail Flows', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('simulation detail loads plan and candidates table within budget @perf', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page);
    const detailPage = new SimulationDetailQaPage(page);

    // Warm the route once to avoid Next.js cold-start skew on perf measurement.
    await detailPage.gotoDetail(QA_BASE_SIMULATION_ID);
    await detailPage.expectPlanSection();
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const startMs = Date.now();
    const [detailResponse, candidatesResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes(`/api/simulations/${QA_BASE_SIMULATION_ID}`) &&
          resp.status() === 200,
      ),
      page.waitForResponse(
        (resp) =>
          resp
            .url()
            .includes(`/api/simulations/${QA_BASE_SIMULATION_ID}/candidates`) &&
          resp.status() === 200,
      ),
      page.reload(),
    ]);

    expect(detailResponse.status()).toBe(200);
    expect(candidatesResponse.status()).toBe(200);

    await expect(page).toHaveURL(
      `/dashboard/simulations/${QA_BASE_SIMULATION_ID}`,
    );
    await detailPage.expectPlanSection();
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`candidate-compare-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:simulation-detail-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.simulationDetailMs);
  });
});
