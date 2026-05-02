import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';

test.describe('Contract-Live: TalentPartner Access', () => {
  test.use({ storageState: storageStates.talentPartnerOnly });

  test('talent partner dashboard and new trial route load against the live stack', async ({
    page,
  }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /new trial/i }),
    ).toBeVisible();

    await page.goto('/dashboard/trials/new', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL('/dashboard/trials/new');
    await expect(
      page.getByRole('heading', { name: /new trial/i }),
    ).toBeVisible();
  });
});
