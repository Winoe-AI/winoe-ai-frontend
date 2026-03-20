import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_INVITE_TOKEN,
  QA_PAGE_BUDGETS,
} from './fixtures/constants';
import { annotatePerf, assertPerfBudget } from './fixtures/perf';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Session Bootstrap Flows', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('candidate session bootstraps and reaches Day 1 start gate within budget @perf', async ({
    page,
  }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: makeCandidateTask({
        id: 1,
        dayIndex: 1,
        type: 'design',
        title: 'Architecture brief',
        description: 'Write your architecture plan.',
      }),
      completedTaskIds: [],
    });

    const sessionPage = new CandidateSessionQaPage(page);

    // Warm the route once to remove Next.js cold-start overhead from perf gating.
    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await expect(
      page.getByRole('button', { name: /start simulation/i }),
    ).toBeVisible();

    const startMs = Date.now();
    const bootstrapResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(`/api/backend/candidate/session/${QA_INVITE_TOKEN}`) &&
        resp.status() === 200,
    );

    await page.reload();
    const bootstrapResponse = await bootstrapResponsePromise;

    expect(bootstrapResponse.status()).toBe(200);
    await expect(page).toHaveURL(`/candidate/session/${QA_INVITE_TOKEN}`);
    await expect(
      page.getByRole('button', { name: /start simulation/i }),
    ).toBeVisible();

    const loadMs = Date.now() - startMs;
    annotatePerf('perf:candidate-session-bootstrap-ms', loadMs);
    assertPerfBudget(loadMs, QA_PAGE_BUDGETS.candidateSessionMs);

    await sessionPage.startSimulation();
    await sessionPage.expectDay(1);
    await expect(page.getByText(/5-day timeline/i)).toBeVisible();
  });

  test('legacy candidate session route redirects to canonical route', async ({ page }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: makeCandidateTask({
        id: 1,
        dayIndex: 1,
        type: 'design',
        title: 'Architecture brief',
        description: 'Write your architecture plan.',
      }),
      completedTaskIds: [],
    });

    await page.goto(`/candidate-sessions/${QA_INVITE_TOKEN}`);

    await expect(page).toHaveURL(`/candidate/session/${QA_INVITE_TOKEN}`);
    await expect(
      page.getByRole('button', { name: /start simulation/i }),
    ).toBeVisible();
  });

  test('expired invite renders invite expired state', async ({ page }) => {
    await page.route(
      `**/api/backend/candidate/session/${QA_INVITE_TOKEN}`,
      async (route) => {
        await route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invite expired' }),
        });
      },
    );

    await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);

    await expect(page.getByText(/invite link unavailable|invite expired/i)).toBeVisible();
  });
});
