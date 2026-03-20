import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateInvitesMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';

test.describe('Error and Edge State Flows', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('unknown route renders not-found state for authenticated user', async ({ page }) => {
    const response = await page.goto('/route-that-does-not-exist');

    expect(response).not.toBeNull();
    await expect(page.getByText(/this page could not be found/i)).toBeVisible();
  });

  test.describe('Recruiter dashboard failures', () => {
    test.use({ storageState: storageStates.recruiterOnly });

    test('dashboard shows recoverable error when /api/dashboard fails', async ({
      page,
    }) => {
      let dashboardCallCount = 0;

      await page.route('**/api/dashboard', async (route) => {
        dashboardCallCount += 1;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' }),
        });
      });

      await page.goto('/dashboard');

      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
      await expect(page.getByText(/couldn.?t load simulations/i)).toBeVisible();

      await page.getByRole('button', { name: /^retry$/i }).click();
      await expect
        .poll(() => dashboardCallCount, {
          message: 'dashboard retry should trigger a second request',
        })
        .toBeGreaterThan(1);
    });
  });

  test.describe('Candidate empty/error/timeout states', () => {
    test.use({ storageState: storageStates.candidateOnly });

    test('candidate dashboard renders empty invite state', async ({ page }) => {
      await installCandidateInvitesMocks(page, { invites: [] });

      await page.goto('/candidate/dashboard');

      await expect(
        page.getByRole('heading', { name: /candidate dashboard/i }),
      ).toBeVisible();
      await expect(page.getByText(/no invites yet/i)).toBeVisible();
    });

    test('candidate session renders load error on backend failure', async ({ page }) => {
      await page.route(
        `**/api/backend/candidate/session/${QA_INVITE_TOKEN}`,
        async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Backend unavailable' }),
          });
        },
      );

      await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);

      await expect(page.getByText(/unable to load simulation/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /^retry$/i })).toBeVisible();
    });

    test('day 2 run-tests timeout state is surfaced to user', async ({ page }) => {
      await installCandidateSessionMocks(page, {
        token: QA_INVITE_TOKEN,
        initialTask: makeCandidateTask({
          id: 2,
          dayIndex: 2,
          type: 'code',
          title: 'Build feature',
          description: 'Implement feature in repo.',
        }),
        completedTaskIds: [1],
        runStatusSequence: [
          {
            status: 'running',
            message: 'Run started',
          },
          {
            status: 'timeout',
            message: 'Tests timed out',
          },
        ],
      });

      await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);
      await page.getByRole('button', { name: /start simulation/i }).click();

      await expect(page.getByText(/^day 2 •/i)).toBeVisible();
      await page.getByRole('button', { name: /run tests/i }).click();

      await expect(
        page.getByRole('button', { name: /running tests/i }),
      ).toBeVisible();
      const mainContent = page.locator('#main-content');
      await expect(
        mainContent.getByRole('status').filter({ hasText: /tests timed out/i }).first(),
      ).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole('button', { name: /retry tests/i })).toBeVisible();
    });
  });
});
