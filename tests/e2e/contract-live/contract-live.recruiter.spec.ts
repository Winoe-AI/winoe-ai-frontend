import { expect, test } from '@playwright/test';
import { storageStates } from '../flow-qa/fixtures/storageStates';

test.describe('Contract-Live: Recruiter Access', () => {
  test.use({ storageState: storageStates.recruiterOnly });

  test('recruiter dashboard and new simulation route load against the live stack', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    await expect(
      page.getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /new simulation/i }),
    ).toBeVisible();

    await page.goto('/dashboard/simulations/new');
    await expect(page).toHaveURL('/dashboard/simulations/new');
    await expect(
      page.getByRole('heading', { name: /new simulation/i }),
    ).toBeVisible();
  });
});
