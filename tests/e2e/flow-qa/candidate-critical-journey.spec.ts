import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateDay4HandoffMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

const sampleDay5Markdown = `## Experience & Challenges

Handled ambiguous requirements by validating assumptions early in the flow.

## Decisions & Tradeoffs

I chose deterministic contracts first so UI and backend validation stayed aligned.

## Learnings & Growth

I traded breadth for reliability and learned to keep the evaluation path simple.

## Collaboration & Communication

I documented risks, handoff notes, and verification steps for reviewers.

## What I Would Do Differently

Next I would add stronger evidence links and broader failure-mode tests.`;

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
        title: 'Reflection Essay',
        description: 'Reflect on your full Trial experience.',
      }),
      completedTaskIds: [],
      completedTaskIdsAfterSubmit: [1, 2, 3, 4],
      isCompleteAfterSubmit: false,
    });

    const sessionPage = new CandidateSessionQaPage(page);

    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startTrial();
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
    await expect(
      page.getByRole('heading', { name: /reflection essay editor/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /markdown editor/i }),
    ).toBeVisible();
    await page
      .getByRole('textbox', { name: /markdown editor/i })
      .fill(sampleDay5Markdown);
    await expect(
      page.getByRole('button', { name: /^preview$/i }),
    ).toBeVisible();
  });

  test('Day4 upload state checkpoint', async ({ page }) => {
    await installCandidateDay4HandoffMocks(page, {
      token: QA_INVITE_TOKEN,
      candidateSessionId: 77,
      taskId: 4,
    });

    await page.goto(`/candidate-sessions/${QA_INVITE_TOKEN}`);
    const startButton = page.getByRole('button', { name: /start trial/i });
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
        title: 'Reflection Essay',
        description: 'Reflect on your full Trial experience.',
      }),
      nextTaskAfterSubmit: null,
      completedTaskIds: [1, 2, 3, 4],
      completedTaskIdsAfterSubmit: [1, 2, 3, 4, 5],
      isCompleteAfterSubmit: true,
    });

    const sessionPage = new CandidateSessionQaPage(page);
    await sessionPage.gotoWithToken(QA_INVITE_TOKEN);
    await sessionPage.startTrial();
    await sessionPage.expectDay(5);

    await page
      .getByRole('textbox', { name: /markdown editor/i })
      .fill(sampleDay5Markdown);

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/5/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page
      .getByRole('button', { name: /submit reflection essay/i })
      .click();
    await page
      .getByRole('dialog', { name: /submit your reflection essay/i })
      .getByRole('button', { name: /submit reflection essay/i })
      .click();
    await submitResponsePromise;

    await expect(page.getByText(/congratulations/i)).toBeVisible();
  });
});
