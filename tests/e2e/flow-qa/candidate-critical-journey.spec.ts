import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateDay4HandoffMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Critical Journey (flow-qa mocked)', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('invite/session start -> Day1 submit -> day progression -> Day5 checkpoint', async ({
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
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Final reflection',
        description: 'Document your decisions and next steps.',
      }),
      completedTaskIds: [],
      completedTaskIdsAfterSubmit: [1, 2, 3, 4],
      isCompleteAfterSubmit: false,
    });

    const sessionPage = new CandidateSessionQaPage(page);

    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startSimulation();
    await sessionPage.expectDay(1);

    const textArea = page.locator('textarea').first();
    await expect(textArea).toBeVisible();
    await textArea.fill(
      'Day 1 response: architecture layers, API contracts, and rollout checkpoints.',
    );

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/1/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page.getByRole('button', { name: /submit & continue/i }).click();
    await submitResponsePromise;

    await sessionPage.expectDay(5);
    await expect(page.getByText(/^day 5 • documentation$/i)).toBeVisible();
    await expect(page.getByLabel(/^challenges$/i)).toBeVisible();
    await expect(page.getByLabel(/^what you would do next$/i)).toBeVisible();
  });

  test('Day4 upload state checkpoint', async ({ page }) => {
    await installCandidateDay4HandoffMocks(page, {
      token: QA_INVITE_TOKEN,
      candidateSessionId: 77,
      taskId: 4,
    });

    await page.goto(`/candidate-sessions/${QA_INVITE_TOKEN}`);
    const startButton = page.getByRole('button', { name: /start simulation/i });
    const day4Heading = page.getByText(/^day 4 • handoff$/i);
    const startVisible = await startButton
      .first()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    if (startVisible) {
      await startButton.first().click();
    }

    await expect(day4Heading).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'handoff.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('video-bytes'),
    });
    await page
      .getByLabel(
        /I understand and consent to submission and processing of my video and transcript for evaluation/i,
      )
      .check();
    await page.getByRole('button', { name: /^complete upload$/i }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: /transcript processing/i })
        .first(),
    ).toBeVisible();
  });

  test('Day5 completion checkpoint', async ({ page }) => {
    await installCandidateSessionMocks(page, {
      token: QA_INVITE_TOKEN,
      initialTask: makeCandidateTask({
        id: 5,
        dayIndex: 5,
        type: 'documentation',
        title: 'Final reflection',
        description: 'Document your decisions and next steps.',
      }),
      nextTaskAfterSubmit: null,
      completedTaskIds: [1, 2, 3, 4],
      completedTaskIdsAfterSubmit: [1, 2, 3, 4, 5],
      isCompleteAfterSubmit: true,
    });

    const sessionPage = new CandidateSessionQaPage(page);
    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startSimulation();
    await sessionPage.expectDay(5);

    await page
      .getByLabel(/^challenges$/i)
      .fill(
        'I balanced speed, correctness, and clear communication with tradeoffs.',
      );
    await page
      .getByLabel(/^decisions$/i)
      .fill(
        'I prioritized deterministic behavior and test coverage for critical user journeys.',
      );
    await page
      .getByLabel(/^tradeoffs$/i)
      .fill(
        'I deferred optional polish to keep key flows stable and observable.',
      );
    await page
      .getByLabel(/^communication \/ handoff$/i)
      .fill(
        'I documented release steps, known risks, and fallback plans for reviewers.',
      );
    await page
      .getByLabel(/^what you would do next$/i)
      .fill(
        'Next, I would improve diagnostics around flaky transitions and artifact retries.',
      );

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/5/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page.getByRole('button', { name: /submit & continue/i }).click();
    await submitResponsePromise;

    await expect(page.getByText(/simulation complete/i)).toBeVisible();
  });
});
