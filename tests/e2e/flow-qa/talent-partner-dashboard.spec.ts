import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_PAGE_BUDGETS } from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';
import { TalentPartnerDashboardQaPage } from './pages';

test.describe('Talent Partner Dashboard Flows', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('dashboard loads with api success, skeleton transition, and perf budget @perf', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page, { dashboardDelayMs: 900 });
    const dashboard = new TalentPartnerDashboardQaPage(page);

    const startMs = Date.now();
    const dashboardResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/dashboard') && resp.status() === 200,
    );
    const navPromise = dashboard.gotoDashboard();

    await expect(page.locator('.animate-pulse').first()).toBeVisible({
      timeout: 2500,
    });
    const dashboardResponse = await dashboardResponsePromise;
    await navPromise;

    expect(dashboardResponse.status()).toBe(200);
    await expect(page).toHaveURL('/dashboard');
    await dashboard.expectDashboardLoaded();
    await expect(
      page.getByRole('link', { name: /frontend platform modernization/i }),
    ).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:dashboard-load-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.dashboardMs);
  });

  test('invite candidate modal validates and submits', async ({ page }) => {
    const mockState = await installTalentPartnerApiMocks(page);
    const dashboard = new TalentPartnerDashboardQaPage(page);

    await dashboard.gotoDashboard();
    await dashboard.expectDashboardLoaded();

    await dashboard.openInviteModal();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toBeVisible();

    await expect(page.getByText(/candidate email is required/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^send invite$/i }),
    ).toBeDisabled();

    await page.getByLabel(/candidate name/i).fill('Jane Candidate');
    await page.getByLabel(/candidate email/i).fill('not-an-email');
    await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^send invite$/i }),
    ).toBeDisabled();

    await page
      .getByLabel(/candidate email/i)
      .fill('jane.candidate@example.com');
    await expect(
      page.getByRole('button', { name: /^send invite$/i }),
    ).toBeEnabled();

    const inviteResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/trials/') &&
        resp.url().includes('/invite') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );

    await page.getByRole('button', { name: /^send invite$/i }).click();
    const inviteResponse = await inviteResponsePromise;

    expect(inviteResponse.status()).toBe(201);
    expect(mockState.inviteRequestCount).toBe(1);
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toHaveCount(0);
    await expect(page).toHaveURL('/dashboard');
  });
});
