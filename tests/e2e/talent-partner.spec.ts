import { expect, test } from '@playwright/test';
import { installTalentPartnerApiMocks } from './flow-qa/fixtures/talent-partnerMocks';
import { storageStates } from './flow-qa/fixtures/storageStates';
import { TalentPartnerDashboardQaPage } from './flow-qa/pages';

test.use({ storageState: storageStates.talentPartnerOnly });

test('talent_partner logs in and sees trials', async ({ page }) => {
  await installTalentPartnerApiMocks(page);

  const talent_partner = new TalentPartnerDashboardQaPage(page);

  await talent_partner.gotoDashboard();

  await expect(page).toHaveURL(/\/dashboard$/);
  await talent_partner.expectDashboardLoaded();

  await expect(
    page.getByRole('link', { name: /frontend platform modernization/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /invite candidate/i }).first(),
  ).toBeVisible();
});
