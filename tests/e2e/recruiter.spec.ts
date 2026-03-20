import { expect, test } from '@playwright/test';
import { installRecruiterApiMocks } from './flow-qa/fixtures/recruiterMocks';
import { storageStates } from './flow-qa/fixtures/storageStates';
import { RecruiterDashboardQaPage } from './flow-qa/pages';

test.use({ storageState: storageStates.recruiterOnly });

test('recruiter logs in and sees simulations', async ({ page }) => {
  await installRecruiterApiMocks(page);

  const recruiter = new RecruiterDashboardQaPage(page);

  await recruiter.gotoDashboard();

  await expect(page).toHaveURL(/\/dashboard$/);
  await recruiter.expectDashboardLoaded();

  await expect(
    page.getByRole('link', { name: /frontend platform modernization/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /invite candidate/i }).first()).toBeVisible();
});
