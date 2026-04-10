import { expect, test } from '@playwright/test';
import { storageStates } from './fixtures/storageStates';
import { QA_INVITE_TOKEN } from './fixtures/constants';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from './fixtures/candidateMocks';
import { installTalentPartnerApiMocks } from './fixtures/talent-partnerMocks';
function ensureMobileProject() {
  test.skip(
    test.info().project.name !== 'mobile-chrome',
    'Responsive suite runs only on mobile-chrome project.',
  );
}
test.describe('Responsive Mobile Flows', () => {
  test('marketing page is usable at mobile viewport', async ({ page }) => {
    ensureMobileProject();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /welcome to/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /talent-partner login/i }),
    ).toBeVisible();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect((viewport?.width ?? 0) <= 450).toBeTruthy();
  });
  test.describe('TalentPartner mobile', () => {
    test.use({ storageState: storageStates.talentPartnerOnly });
    test('dashboard content and invite modal work on mobile', async ({
      page,
    }) => {
      ensureMobileProject();
      await installTalentPartnerApiMocks(page);
      await page.goto('/dashboard');
      await expect(
        page.getByRole('heading', { name: /dashboard/i }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /frontend platform modernization/i }),
      ).toBeVisible();
      await page
        .getByRole('button', { name: /invite candidate/i })
        .first()
        .click();
      await expect(
        page.getByRole('heading', { name: /invite candidate/i }),
      ).toBeVisible();
      await page.getByRole('button', { name: /^close$/i }).click();
      await expect(
        page.getByRole('heading', { name: /invite candidate/i }),
      ).toHaveCount(0);
    });
  });
  test.describe('Candidate mobile', () => {
    test.use({ storageState: storageStates.candidateOnly });
    test('day 1 text task remains editable and actionable on mobile', async ({
      page,
    }) => {
      ensureMobileProject();
      await installCandidateSessionMocks(page, {
        token: QA_INVITE_TOKEN,
        initialTask: makeCandidateTask({
          id: 1,
          dayIndex: 1,
          type: 'design',
          title: 'Architecture brief',
          description: 'Write your architecture plan.',
        }),
        nextTaskAfterSubmit: makeCandidateTask({
          id: 2,
          dayIndex: 2,
          type: 'code',
          title: 'Build feature',
          description: 'Implement feature in repo.',
        }),
      });
      await page.goto(`/candidate/session/${QA_INVITE_TOKEN}`);
      await page.getByRole('button', { name: /start trial/i }).click();
      await expect(page.getByText(/^day 1 •/i)).toBeVisible();
      const textArea = page.locator('textarea').first();
      await expect(textArea).toBeVisible();
      await textArea.fill(
        'Mobile flow response: verifying candidate task editor and submit actions on a small viewport.',
      );
      await page.getByRole('button', { name: /save draft/i }).click();
      await expect(
        page.getByRole('button', { name: /submit & continue/i }),
      ).toBeVisible();
    });
  });
});
