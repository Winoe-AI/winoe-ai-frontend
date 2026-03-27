import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';
import {
  annotatePerf,
  CANDIDATE_DASHBOARD_BUDGET_MS,
} from './live-app-flow.shared';

test.describe('Live Integration Lane: Candidate', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('candidate dashboard loads and recruiter routes are blocked', async ({
    page,
  }) => {
    // Untimed warm-up pass so cold compile does not skew perf assertions.
    await page.goto('/candidate/dashboard');
    await expect(page).toHaveURL('/candidate/dashboard');
    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /your invitations/i }),
    ).toBeVisible();

    const candidateDashboardStartMs = Date.now();
    const invitesResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/candidate/invites') &&
        resp.request().method() === 'GET' &&
        resp.status() === 200,
    );

    await page.reload();
    expect((await invitesResponsePromise).status()).toBe(200);
    await expect(page).toHaveURL('/candidate/dashboard');
    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /your invitations/i }),
    ).toBeVisible();

    const dashboardMs = Date.now() - candidateDashboardStartMs;
    annotatePerf('perf:integration-candidate-dashboard-load-ms', dashboardMs);
    expect(dashboardMs).toBeLessThan(CANDIDATE_DASHBOARD_BUDGET_MS);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/not-authorized\?mode=recruiter/);
    await expect(
      page.getByRole('heading', { name: /not authorized/i }),
    ).toBeVisible();
  });
});
