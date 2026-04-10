import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import {
  QA_BASE_TRIAL_ID,
  QA_CANDIDATE_SESSION_ID,
} from './fixtures/constants';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';
import { TrialDetailQaPage } from './pages';

test.describe('TalentPartner Trial Detail Actions', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('candidate table actions support search, resend cooldown, invite modal, and terminate modal', async ({
    page,
  }) => {
    await installTalentPartnerApiMocks(page);
    const detailPage = new TrialDetailQaPage(page);
    await detailPage.gotoDetail(QA_BASE_TRIAL_ID);
    await detailPage.expectPlanSection();

    await page.getByLabel(/search candidates/i).fill('nobody@missing.dev');
    await expect(
      page.getByText(/no candidates match your search\./i),
    ).toBeVisible();
    await page.getByLabel(/search candidates/i).fill('jane');
    await expect(
      page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`),
    ).toBeVisible();

    const resendResponsePromise = page.waitForResponse(
      (resp) =>
        resp
          .url()
          .includes(
            `/api/trials/${QA_BASE_TRIAL_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/invite/resend`,
          ) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page
      .getByRole('button', { name: /resend invite/i })
      .first()
      .click();
    expect((await resendResponsePromise).status()).toBe(200);

    await detailPage.openInviteModal();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toBeVisible();
    await page.getByRole('button', { name: /close/i }).click();
    await expect(
      page.getByRole('heading', { name: /invite candidate/i }),
    ).toHaveCount(0);

    await page
      .getByRole('button', { name: /terminate trial/i })
      .first()
      .click();
    await expect(page.getByTestId('terminate-trial-modal')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /terminate trial/i }).last(),
    ).toBeDisabled();
    await page.getByLabel(/confirm-terminate-trial/i).check();
    await expect(
      page.getByRole('button', { name: /terminate trial/i }).last(),
    ).toBeEnabled();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByTestId('terminate-trial-modal')).toHaveCount(0);
  });
});
