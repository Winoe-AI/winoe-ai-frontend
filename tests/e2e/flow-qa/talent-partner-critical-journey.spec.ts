import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_TRIAL_ID,
  QA_CANDIDATE_SESSION_ID,
  QA_CREATED_TRIAL_ID,
} from './fixtures/constants';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';

test.describe('TalentPartner Critical Journey (flow-qa mocked)', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('dashboard -> create trial -> invite -> submissions -> winoe report', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page, {
      trialId: QA_BASE_TRIAL_ID,
      createTrialId: QA_CREATED_TRIAL_ID,
      candidateSessionId: QA_CANDIDATE_SESSION_ID,
    });

    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: /dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /frontend platform modernization/i }),
    ).toBeVisible();

    await page.goto('/dashboard/trials/new');
    await expect(
      page.getByRole('heading', { name: /new trial/i }),
    ).toBeVisible();
    await page.getByLabel(/role title/i).fill('QA Critical Journey Sim');
    await page.getByLabel(/role description/i).fill('Senior Frontend Engineer');
    await page
      .getByLabel(/preferred language\/framework/i)
      .fill('TypeScript + Next.js');

    const createButton = page.getByRole('button', {
      name: /create trial/i,
    });
    await expect(createButton).toBeEnabled();

    const createResponsePromise = page.waitForResponse(
      (resp) =>
        new URL(resp.url()).pathname === '/api/trials' &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );
    const createdTrialUrl = `/dashboard/trials/${QA_CREATED_TRIAL_ID}`;
    const createRedirectPromise = page.waitForURL(createdTrialUrl, {
      timeout: 30_000,
    });

    await createButton.click();
    const createResponse = await createResponsePromise;
    const createPayload = (await createResponse.json()) as { id?: unknown };
    expect(String(createPayload.id ?? '')).toBe(QA_CREATED_TRIAL_ID);
    await createRedirectPromise;

    await expect(page).toHaveURL(createdTrialUrl);
    await expect(page.getByText(/5-day trial plan/i)).toBeVisible();

    await page
      .getByRole('button', { name: /invite candidate/i })
      .first()
      .click();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toBeVisible();
    await page.getByLabel(/candidate name/i).fill('Casey Candidate');
    await page
      .getByLabel(/candidate email/i)
      .fill('casey.candidate@example.com');

    const inviteResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/invite') &&
        resp.request().method() === 'POST' &&
        resp.status() === 201,
    );
    await page.getByRole('button', { name: /^send invite$/i }).click();
    await inviteResponsePromise;

    await expect(
      page.getByText(/Invite sent for Casey Candidate/i),
    ).toBeVisible();

    await page.goto(
      `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}`,
    );
    await expect(
      page.getByRole('heading', { name: /submissions/i }),
    ).toBeVisible();
    await expect(page.getByText(/latest github artifacts/i)).toBeVisible();

    const winoeReportUrl = `/dashboard/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/winoe-report`;
    await page.goto(winoeReportUrl);

    await expect(page).toHaveURL(winoeReportUrl);
    await expect(
      page.getByRole('heading', { name: /^winoe report$/i }),
    ).toBeVisible();
    await expect(page.getByText(/overall winoe score/i)).toBeVisible();
  });
});
