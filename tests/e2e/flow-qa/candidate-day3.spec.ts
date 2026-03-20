import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Day 3 Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('day 3 run-tests failure is surfaced and submit advances to Day 4', async ({
    page,
  }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: makeCandidateTask({
        id: 3,
        dayIndex: 3,
        type: 'code',
        title: 'Debug and finalize',
        description: 'Fix bugs and finalize.',
      }),
      nextTaskAfterSubmit: makeCandidateTask({
        id: 4,
        dayIndex: 4,
        type: 'handoff',
        title: 'Handoff demo',
        description: 'Upload your walkthrough video.',
      }),
      completedTaskIds: [1, 2],
      completedTaskIdsAfterSubmit: [1, 2, 3],
      runStatusSequence: [
        {
          status: 'running',
          message: 'Run started',
          passed: null,
          failed: null,
          total: null,
          stdout: null,
          stderr: null,
        },
        {
          status: 'failed',
          message: 'Tests failed',
          passed: 10,
          failed: 1,
          total: 11,
          stdout: '1 failing test.',
          stderr: 'Expected true, received false',
        },
      ],
    });

    const sessionPage = new CandidateSessionQaPage(page);

    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startSimulation();

    await sessionPage.expectDay(3);

    await page.getByRole('button', { name: /run tests/i }).click();
    await expect(
      page.getByRole('button', { name: /running tests/i }),
    ).toBeVisible();
    const mainContent = page.locator('#main-content');
    await expect(
      mainContent.getByRole('status').filter({ hasText: /tests failed/i }).first(),
    ).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole('button', { name: /retry tests/i })).toBeVisible();
    await expect(page.getByText(/expected true, received false/i)).toBeVisible();

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/3/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );

    await page.getByRole('button', { name: /submit & continue/i }).click();
    const submitResponse = await submitResponsePromise;

    expect(submitResponse.status()).toBe(200);
    await sessionPage.expectDay(4);
    await expect(page.getByRole('button', { name: /upload video/i })).toBeVisible();
  });
});
