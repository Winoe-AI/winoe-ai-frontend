import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';

const DASHBOARD_BUDGET_MS = 10_000;
const CREATE_FLOW_BUDGET_MS = 20_000;
const CANDIDATE_DASHBOARD_BUDGET_MS = 10_000;

function annotatePerf(type: string, valueMs: number) {
  test.info().annotations.push({
    type,
    description: String(valueMs),
  });
}

test.describe('Live Integration Lane: Recruiter', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('recruiter dashboard and create simulation hit live backend successfully', async ({
    page,
  }) => {
    const dashboardStartMs = Date.now();
    const dashboardResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dashboard') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.goto('/dashboard');
    const dashboardResponse = await dashboardResponsePromise;

    expect(dashboardResponse.status()).toBe(200);
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new simulation/i })).toBeVisible();

    const dashboardLoadMs = Date.now() - dashboardStartMs;
    annotatePerf('perf:integration-dashboard-load-ms', dashboardLoadMs);
    expect(dashboardLoadMs).toBeLessThan(DASHBOARD_BUDGET_MS);

    await page.goto('/dashboard/simulations/new');

    await expect(page).toHaveURL('/dashboard/simulations/new');
    await expect(page.getByRole('heading', { name: /new simulation/i })).toBeVisible();

    const uniqueTitle = `E2E Integration ${Date.now()}`;
    await page.getByLabel(/^title$/i).fill(uniqueTitle);
    await page.getByLabel(/^role$/i).fill('Senior Frontend Engineer');
    await page
      .getByLabel(/tech stack/i)
      .fill('TypeScript, Next.js, Playwright');
    await page
      .getByLabel(/focus/i)
      .fill('Integration lane validation for recruiter and candidate workflows.');

    const createStartMs = Date.now();
    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/simulations') &&
        resp.request().method() === 'POST',
    );

    await page.getByRole('button', { name: /create simulation/i }).click();
    const createResponse = await createResponsePromise;

    const createPayloadRaw = await createResponse.text();
    expect(
      createResponse.status(),
      `Create simulation response: ${createPayloadRaw}`,
    ).toBe(201);
    const createPayload = JSON.parse(createPayloadRaw) as {
      id?: string | number;
    };
    const simulationId = String(createPayload.id ?? '').trim();
    expect(simulationId.length).toBeGreaterThan(0);

    await expect(page).toHaveURL(
      new RegExp(`/dashboard/simulations/${simulationId}$`),
    );

    const detailResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/simulations/${simulationId}`) &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.goto(`/dashboard/simulations/${simulationId}`);
    const detailResponse = await detailResponsePromise;

    expect(detailResponse.status()).toBe(200);
    await expect(
      page.getByText(new RegExp(`Simulation ID:\\s*${simulationId}`, 'i')),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /invite candidate/i }),
    ).toBeVisible();

    const createFlowMs = Date.now() - createStartMs;
    annotatePerf('perf:integration-create-flow-ms', createFlowMs);
    expect(createFlowMs).toBeLessThan(CREATE_FLOW_BUDGET_MS);
  });
});

test.describe('Live Integration Lane: Candidate', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('candidate dashboard loads and recruiter routes are blocked', async ({
    page,
  }) => {
    const candidateDashboardStartMs = Date.now();
    const invitesResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/candidate/invites') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.goto('/candidate/dashboard');
    const invitesResponse = await invitesResponsePromise;

    expect(invitesResponse.status()).toBe(200);
    await expect(page).toHaveURL('/candidate/dashboard');
    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /your invitations/i })).toBeVisible();

    const candidateDashboardLoadMs = Date.now() - candidateDashboardStartMs;
    annotatePerf(
      'perf:integration-candidate-dashboard-load-ms',
      candidateDashboardLoadMs,
    );
    expect(candidateDashboardLoadMs).toBeLessThan(CANDIDATE_DASHBOARD_BUDGET_MS);

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/not-authorized\?mode=recruiter/);
    await expect(
      page.getByRole('heading', { name: /not authorized/i }),
    ).toBeVisible();
  });
});
