import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_BASE_SIMULATION_ID, QA_CANDIDATE_SESSION_ID } from './fixtures/constants';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';
import { SimulationDetailQaPage } from './pages';

test.describe('Recruiter Simulation Detail Actions', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('candidate table actions support search, resend cooldown, invite modal, and terminate modal', async ({
    page,
  }) => {
    await installRecruiterApiMocks(page);
    const detailPage = new SimulationDetailQaPage(page);
    await detailPage.gotoDetail(QA_BASE_SIMULATION_ID);
    await detailPage.expectPlanSection();

    await page.getByLabel(/search candidates/i).fill('nobody@missing.dev');
    await expect(page.getByText(/no candidates match your search\./i)).toBeVisible();
    await page.getByLabel(/search candidates/i).fill('jane');
    await expect(page.getByTestId(`candidate-row-${QA_CANDIDATE_SESSION_ID}`)).toBeVisible();

    const resendResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes(
          `/api/simulations/${QA_BASE_SIMULATION_ID}/candidates/${QA_CANDIDATE_SESSION_ID}/invite/resend`,
        ) &&
        resp.request().method() === 'POST' &&
        resp.status() === 200,
    );
    await page.getByRole('button', { name: /resend invite/i }).first().click();
    expect((await resendResponsePromise).status()).toBe(200);

    await detailPage.openInviteModal();
    await expect(page.getByRole('heading', { name: /invite candidate/i })).toBeVisible();
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByRole('heading', { name: /invite candidate/i })).toHaveCount(0);

    await page.getByRole('button', { name: /terminate simulation/i }).first().click();
    await expect(page.getByTestId('terminate-simulation-modal')).toBeVisible();
    await expect(page.getByRole('button', { name: /terminate simulation/i }).last()).toBeDisabled();
    await page.getByLabel(/confirm-terminate-simulation/i).check();
    await expect(page.getByRole('button', { name: /terminate simulation/i }).last()).toBeEnabled();
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await expect(page.getByTestId('terminate-simulation-modal')).toHaveCount(0);
  });
});
