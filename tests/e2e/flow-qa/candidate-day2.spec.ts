import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Day 2 Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('day 2 workspace + tests + submit transitions to Day 3', async ({ page }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: makeCandidateTask({
        id: 2,
        dayIndex: 2,
        type: 'code',
        title: 'Build feature',
        description: 'Implement feature in repo.',
      }),
      nextTaskAfterSubmit: makeCandidateTask({
        id: 3,
        dayIndex: 3,
        type: 'code',
        title: 'Debug and finalize',
        description: 'Fix bugs and finalize.',
      }),
      completedTaskIds: [1],
      completedTaskIdsAfterSubmit: [1, 2],
      runStatusSequence: [
        {
          status: 'running',
          message: 'Run started',
          passed: null,
          failed: null,
          total: null,
          stdout: null,
          stderr: null,
          workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/1',
          commitSha: 'abc1234def5678',
        },
        {
          status: 'passed',
          message: 'All checks passed',
          passed: 12,
          failed: 0,
          total: 12,
          stdout: 'All tests passed.',
          stderr: null,
          workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/1',
          commitSha: 'abc1234def5678',
        },
      ],
    });

    const sessionPage = new CandidateSessionQaPage(page);

    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startSimulation();

    await sessionPage.expectDay(2);
    await expect(page.getByText(/coding workspace/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open codespace|open repo/i })).toBeVisible();

    const runInitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/2/run') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );

    await page.getByRole('button', { name: /run tests/i }).click();
    const runInitResponse = await runInitResponsePromise;

    expect(runInitResponse.status()).toBe(200);
    await expect(
      page.getByRole('button', { name: /running tests/i }),
    ).toBeVisible();
    const mainContent = page.locator('#main-content');
    await expect(
      mainContent.getByRole('status').filter({ hasText: /all checks passed/i }).first(),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /re-run tests/i })).toBeVisible();

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/2/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );

    await page.getByRole('button', { name: /submit & continue/i }).click();
    const submitResponse = await submitResponsePromise;

    expect(submitResponse.status()).toBe(200);
    await sessionPage.expectDay(3);
  });
});
