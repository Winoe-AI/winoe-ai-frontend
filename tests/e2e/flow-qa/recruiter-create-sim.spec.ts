import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_CREATED_SIMULATION_ID,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';
import { SimulationCreateQaPage } from './pages';

test.describe('Recruiter Create Simulation Flows', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('create simulation form validates required fields', async ({ page }) => {
    await installRecruiterApiMocks(page);
    const createPage = new SimulationCreateQaPage(page);

    await createPage.gotoCreate();

    await expect(page).toHaveURL('/dashboard/simulations/new');
    await expect(page.getByRole('heading', { name: /new simulation/i })).toBeVisible();

    await createPage.submitCreate();

    await expect(page.getByText(/title is required\./i)).toBeVisible();
    await expect(page).toHaveURL('/dashboard/simulations/new');
  });

  test('create simulation submits and navigates to detail page within budget @perf', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page, {
      simulationId: QA_CREATED_SIMULATION_ID,
      createSimulationId: QA_CREATED_SIMULATION_ID,
    });
    const createPage = new SimulationCreateQaPage(page);

    // Warm create/detail routes before perf timing to avoid compile-time skew.
    await createPage.gotoCreate();
    await page.goto(`/dashboard/simulations/${QA_CREATED_SIMULATION_ID}`);
    await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();
    await createPage.gotoCreate();

    const startMs = Date.now();
    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/simulations') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await createPage.fillTitle('QA Simulation: Frontend Platform Flow');
    await page.getByLabel(/^role$/i).fill('Senior Frontend Engineer');
    await page.getByLabel(/tech stack/i).fill('TypeScript + Next.js');

    await createPage.submitCreate();
    const createResponse = await createResponsePromise;

    expect(createResponse.status()).toBe(201);
    await expect(page).toHaveURL(
      `/dashboard/simulations/${QA_CREATED_SIMULATION_ID}`,
    );
    await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:create-simulation-flow-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.simulationDetailMs);
  });
});
