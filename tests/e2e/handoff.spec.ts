import { expect, test } from '@playwright/test';
import { QA_INVITE_TOKEN } from './flow-qa/fixtures/constants';
import { installCandidateDay4HandoffMocks } from './flow-qa/fixtures/candidateMocks';
import { storageStates } from './flow-qa/fixtures/storageStates';
import { CandidateSessionQaPage } from './flow-qa/pages';
test.use({ storageState: storageStates.candidateOnly });
test('candidate Day 4 handoff upload flow hydrates and reaches transcript ready', async ({
  page,
}) => {
  const handoffState = await installCandidateDay4HandoffMocks(page, {
    token: QA_INVITE_TOKEN,
    candidateSessionId: 77,
    taskId: 4,
  });
  const sessionPage = new CandidateSessionQaPage(page);
  const bootstrapResponsePromise = page.waitForResponse(
    (resp) =>
      resp
        .url()
        .includes(`/api/backend/candidate/session/${QA_INVITE_TOKEN}`) &&
      resp.status() === 200,
  );
  await page.goto(`/candidate-sessions/${QA_INVITE_TOKEN}`);
  const bootstrapResponse = await bootstrapResponsePromise;
  expect(bootstrapResponse.status()).toBe(200);
  await expect(page).toHaveURL(`/candidate/session/${QA_INVITE_TOKEN}`);
  const startButton = page.getByRole('button', { name: /start trial/i });
  if ((await startButton.count()) > 0) {
    await startButton.first().click();
  }
  await sessionPage.expectDay(4);
  await expect(page.getByText(/^day 4 • handoff$/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^upload video$/i }),
  ).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'handoff.mp4',
    mimeType: 'video/mp4',
    buffer: Buffer.from('video-bytes'),
  });
  const completeUploadButton = page.getByRole('button', {
    name: /^complete upload$/i,
  });
  await expect(completeUploadButton).toBeDisabled();
  await page
    .getByLabel(
      /I understand and consent to submission and processing of my video and transcript for evaluation/i,
    )
    .check();
  await completeUploadButton.click();
  await expect(
    page.getByRole('button', { name: /^replace upload$/i }),
  ).toBeVisible();
  const mainContent = page.locator('#main-content');
  await expect(
    mainContent
      .getByRole('status')
      .filter({ hasText: /transcript processing/i })
      .first(),
  ).toBeVisible();
  await expect(page.getByText(/final transcript from backend\./i)).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/00:00 - 00:01/i)).toBeVisible();
  await expect(page.getByText(/hello/i)).toBeVisible();
  await page
    .getByRole('button', { name: /^delete upload$/i })
    .first()
    .click();
  await expect(
    page.getByRole('dialog', { name: /delete upload confirmation/i }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /^delete upload$/i })
    .last()
    .click();
  await expect(page.getByText(/upload deleted/i)).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^upload video$/i }),
  ).toBeVisible();
  expect(handoffState.initBody).toEqual({
    contentType: 'video/mp4',
    filename: 'handoff.mp4',
    sizeBytes: 11,
  });
  expect(handoffState.completeBody).toEqual({
    recordingId: 'rec_123',
    consentAccepted: true,
    aiNoticeVersion: 'mvp1',
    noticeVersion: 'mvp1',
  });
});
