import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';

test.describe('Contract-Live: Candidate Access', () => {
  test.use({ storageState: storageStates.candidateOnly });

  test('candidate dashboard loads against the live stack and talent_partner routes stay blocked', async ({
    page,
  }) => {
    await page.goto('/candidate/dashboard');
    await expect(page).toHaveURL('/candidate/dashboard');
    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /your invitations/i }),
    ).toBeVisible();

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/not-authorized\?mode=talent_partner/);
    await expect(
      page.getByRole('heading', { name: /not authorized/i }),
    ).toBeVisible();
  });
});
