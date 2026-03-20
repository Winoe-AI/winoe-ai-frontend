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

  test('candidate table actions support search, resend cooldown, invite modal, and terminate modal', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page);
    const detailPage = new SimulationDetailQaPage(page);

    await detailPage.gotoDetail(QA_BASE_SIMULATION_ID);
    await detailPage.expectPlanSection();

    await page.getByLabel(/search candidates/i).fill('nobody@missing.dev');
    await expect(
      page.getByText(/no candidates match your search\./i),
    ).toBeVisible();

    await page.getByLabel(/search candidates/i).fill('jane');
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const resendResponsePromise = page.waitForResponse(
      (resp) =>
        resp
          .url()
          .includes(
            `/api/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/invite/resend`,
          ) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page
      .getByRole('button', { name: /resend invite/i })
      .first()
      .click();
    const resendResponse = await resendResponsePromise;
    expect(resendResponse.status()).toBe(200);

    await detailPage.openInviteModal();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /close/i }).click();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toHaveCount(0);

    await page
      .getByRole('button', { name: /terminate simulation/i })
      .first()
      .click();
    await expect(page.getByTestId('terminate-simulation-modal')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /terminate simulation/i }).last(),
    ).toBeDisabled();
    await page.getByLabel(/confirm-terminate-simulation/i).check();
    await expect(
      page.getByRole('button', { name: /terminate simulation/i }).last(),
    ).toBeEnabled();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByTestId('terminate-simulation-modal')).toHaveCount(0);
  });
});
