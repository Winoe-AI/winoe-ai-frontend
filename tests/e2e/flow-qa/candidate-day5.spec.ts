import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { CandidateSessionQaPage } from './pages';

test.describe('Candidate Day 5 Flow', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('day 5 reflection validates fields, supports preview, and submits to completion', async ({
    page,
  }) => {
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
    await sessionPage.startTrial();
    await sessionPage.expectDay(5);
    await expect(page.getByText(/^day 5 • documentation$/i)).toBeVisible();
    const submitButton = page.getByRole('button', {
      name: /submit & continue/i,
    });
    await expect(submitButton).toBeDisabled();
    await expect(
      page.getByText(
        /complete all sections with at least 20 characters to submit\./i,
      ),
    ).toBeVisible();

    const challengesField = page.getByLabel(/^challenges$/i);
    await challengesField.focus();
    await page.keyboard.press('Tab');
    await expect(
      page.getByText(/this section is required\./i).first(),
    ).toBeVisible();

    await challengesField.fill(
      'The hardest challenge was sequencing Day 2 and Day 3 work while preserving test stability.',
    );
    await page
      .getByLabel(/^decisions$/i)
      .fill(
        'I chose a typed API layer first so behavior changes were safer and easier to validate.',
      );
    await page
      .getByLabel(/^tradeoffs$/i)
      .fill(
        'I traded breadth for reliability, prioritizing deterministic workflows over optional enhancements.',
      );
    await page
      .getByLabel(/^communication \/ handoff$/i)
      .fill(
        'I documented release notes, risks, and verification steps to make execution transparent for reviewers.',
      );
    await page
      .getByLabel(/^what you would do next$/i)
      .fill(
        'Next I would add failure-mode tests, telemetry for flaky transitions, and improve regression dashboards.',
      );
    await page.getByRole('button', { name: /^preview$/i }).click();
    await expect(page.getByText(/what i would do next/i)).toBeVisible();
    await page.getByRole('button', { name: /^write$/i }).click();
    await expect(submitButton).toBeEnabled();
    await page.getByRole('button', { name: /save draft/i }).click();
    const submitResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/backend/tasks/5/submit') &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await submitButton.click();
    const submitResponse = await submitResponsePromise;
    expect(submitResponse.status()).toBe(200);
    await expect(page.getByText(/trial complete/i)).toBeVisible({
      timeout: 8000,
    });
  });
});
