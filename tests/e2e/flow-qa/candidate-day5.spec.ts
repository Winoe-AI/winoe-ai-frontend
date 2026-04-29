import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
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

test.describe('Candidate Day 5 Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('day 5 reflection markdown editor supports preview and submits to completion', async ({
    page,
  }) => {
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

    await expect(
      page.getByRole('heading', { name: /reflection essay editor/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/9:00 AM–9:00 PM your local time/i),
    ).toBeVisible();

    const editor = page.getByRole('textbox', { name: /markdown editor/i });
    await editor.fill(sampleDay5Markdown);

    await page.getByRole('button', { name: /^preview$/i }).click();
    await expect(
      page.getByRole('heading', { name: /experience & challenges/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /what i would do differently/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /^write$/i }).click();

    const submitButton = page.getByRole('button', {
      name: /submit reflection essay/i,
    });
    await expect(submitButton).toBeEnabled();

    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/5/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await submitButton.click();
    await page
      .getByRole('dialog', { name: /submit your reflection essay/i })
      .getByRole('button', { name: /submit reflection essay/i })
      .click();
    const submitResponse = await submitResponsePromise;
    expect(submitResponse.status()).toBe(200);
    await expect(page.getByText(/congratulations/i)).toBeVisible({
      timeout: 8000,
    });
  });
});
