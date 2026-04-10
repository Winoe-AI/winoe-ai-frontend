import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Day 1 Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('day 1 text task supports editing, draft save, and submit to Day 2', async ({
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
      nextTaskAfterSubmit: makeCandidateTask({
        id: 2,
        dayIndex: 2,
        type: 'code',
        title: 'Build feature',
        description: 'Implement feature in repo.',
      }),
      completedTaskIds: [],
      completedTaskIdsAfterSubmit: [1],
    });

    const sessionPage = new CandidateSessionQaPage(page);

    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startTrial();

    await sessionPage.expectDay(1);
    const textArea = page.locator('textarea').first();
    await expect(textArea).toBeVisible();

    await textArea.fill(
      'Day 1 response: propose architecture layers, API contracts, and delivery checkpoints.',
    );

    await page.getByRole('button', { name: /save draft/i }).click();

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/1/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );

    await page.getByRole('button', { name: /submit & continue/i }).click();
    const submitResponse = await submitResponsePromise;

    expect(submitResponse.status()).toBe(200);
    await sessionPage.expectDay(2);
    await expect(page.getByText(/coding workspace/i)).toBeVisible();
  });
});
