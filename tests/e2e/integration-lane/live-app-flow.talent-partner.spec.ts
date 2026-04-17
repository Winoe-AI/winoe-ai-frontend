import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';
import {
  annotatePerf,
  CREATE_FLOW_BUDGET_MS,
  DASHBOARD_BUDGET_MS,
} from './live-app-flow.shared';

test.describe('Live Integration Lane: TalentPartner', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('talent partner dashboard and create trial hit live backend successfully', async ({
    page,
  }) => {
    // Untimed warm-up pass so cold compile does not skew perf assertions.
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /new trial/i }),
    ).toBeVisible();

    const dashboardStartMs = Date.now();
    const dashboardResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/dashboard') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.reload();
    expect((await dashboardResponsePromise).status()).toBe(200);
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /new trial/i }),
    ).toBeVisible();

    annotatePerf(
      'perf:integration-dashboard-load-ms',
      Date.now() - dashboardStartMs,
    );
    expect(Date.now() - dashboardStartMs).toBeLessThan(DASHBOARD_BUDGET_MS);

    await page.goto('/dashboard/trials/new');
    await expect(page).toHaveURL('/dashboard/trials/new');
    await expect(
      page.getByRole('heading', { name: /new trial/i }),
    ).toBeVisible();

    const uniqueTitle = `E2E Integration ${Date.now()}`;
    await page.getByLabel(/role title/i).fill(uniqueTitle);
    await page.getByLabel(/role description/i).fill('Senior Frontend Engineer');
    await page
      .getByLabel(/preferred language\/framework/i)
      .fill('TypeScript, Next.js, Playwright');
    await page
      .getByLabel(/focus/i)
      .fill(
        'Integration lane validation for talent_partner and candidate workflows.',
      );

    const createStartMs = Date.now();
    const createResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/trials') &&
        resp.request().method() === 'POST',
    );

    await page.getByRole('button', { name: /create trial/i }).click();
    const createResponse = await createResponsePromise;
    const createPayloadRaw = await createResponse.text();
    expect(createResponse.status(), createPayloadRaw).toBe(201);

    const payload = JSON.parse(createPayloadRaw) as { id?: string | number };
    const trialId = String(payload.id ?? '').trim();
    expect(trialId.length).toBeGreaterThan(0);

    await page.goto(`/dashboard/trials/${trialId}`);
    await page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/trials/${trialId}`) &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );
    await expect(
      page.getByText(new RegExp(`Trial ID:\\s*${trialId}`, 'i')),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /invite candidate/i }),
    ).toBeVisible();

    annotatePerf('perf:integration-create-flow-ms', Date.now() - createStartMs);
    expect(Date.now() - createStartMs).toBeLessThan(CREATE_FLOW_BUDGET_MS);
  });
});
