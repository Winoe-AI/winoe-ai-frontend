import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateInvitesMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { installRecruiterApiMocks } from './fixtures/recruiterMocks';

test.describe('Navigation Flows', () => {
  test('marketing auth CTA points to Auth0 start and supports keyboard focus', async ({
    page,
  }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();

    const recruiterLoginLink = page.getByRole('link', {
      name: /recruiter login/i,
    });
    await expect(recruiterLoginLink).toHaveAttribute(
      'href',
      /\/auth\/start\?returnTo=%2Fdashboard&mode=recruiter&connection=Tenon-Recruiters/i,
    );
  });

  test.describe('Recruiter navigation', () => {
    test.use({ storageState: storageStates.recruiterOnly });

    test('dashboard to create simulation and back', async ({ page }) => {
      await installRecruiterApiMocks(page);

      await page.goto('/dashboard');
      await expect(page).toHaveURL('/dashboard');
      await expect(
        page.getByRole('heading', { name: /dashboard/i }),
      ).toBeVisible();

      await page.getByRole('link', { name: /new simulation/i }).click();
      await expect(page).toHaveURL('/dashboard/simulations/new');
      await expect(
        page.getByRole('heading', { name: /new simulation/i }),
      ).toBeVisible();

      await page.getByRole('button', { name: /^back$/i }).click();
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Candidate navigation', () => {
    test.use({ storageState: storageStates.candidateOnly });

    test('start screen returns to candidate dashboard', async ({ page }) => {
      await installCandidateSessionMocks(page, {
        token: QA_INVITE_TOKEN,
        initialTask: makeCandidateTask({
          id: 1,
          dayIndex: 1,
          type: 'design',
          title: 'Architecture brief',
          description: 'Write your architecture plan.',
        }),
      });
      await installCandidateInvitesMocks(page);

      await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);
      await expect(
        page.getByRole('button', { name: /back to candidate dashboard/i }),
      ).toBeVisible();

      await page
        .getByRole('button', { name: /back to candidate dashboard/i })
        .click();

      await expect(page).toHaveURL('/candidate/dashboard');
      await expect(
        page.getByRole('heading', { name: /candidate dashboard/i }),
      ).toBeVisible();
      await expect(page.getByText(/your invitations/i)).toBeVisible();
    });

    test('candidate can open what-we-evaluate page', async ({ page }) => {
      await page.goto('/candidate/what-we-evaluate');

      await expect(page).toHaveURL('/candidate/what-we-evaluate');
      await expect(
        page.getByRole('heading', { name: /what we evaluate/i }),
      ).toBeVisible();
      await expect(page.getByText(/review focus areas/i)).toBeVisible();
      await expect(page.getByText(/ai-assisted processing/i)).toBeVisible();
    });
  });
});
