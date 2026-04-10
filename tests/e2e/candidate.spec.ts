import { expect, test } from '@playwright/test';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './flow-qa/fixtures/candidateMocks';
import { QA_INVITE_TOKEN } from './flow-qa/fixtures/constants';
import { storageStates } from './flow-qa/fixtures/storageStates';
import { CandidateSessionQaPage } from './flow-qa/pages';

test.use({ storageState: storageStates.candidateOnly });

test('candidate completes Day 1', async ({ page }) => {
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

  const candidate = new CandidateSessionQaPage(page);

  await candidate.gotoWithToken(QA_INVITE_TOKEN);
  await candidate.startTrial();
  await candidate.expectDay(1);

  const textInput = page.locator('textarea').first();
  await expect(textInput).toBeVisible();
  await textInput.fill(
    'Baseline Day 1 response for deterministic regression coverage.',
  );

  await page.getByRole('button', { name: /save draft/i }).click();
  await page.getByRole('button', { name: /submit & continue/i }).click();

  await candidate.expectDay(2);
});
