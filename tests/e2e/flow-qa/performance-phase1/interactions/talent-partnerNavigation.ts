import { expect } from '@playwright/test';
import { installTalentPartnerApiMocks } from '../../fixtures/talent-partnerMocks';
import { PERF_MODE } from '../config';
import { waitForAnyVisible } from '../helpers';
import type { InteractionContext } from './context';

export async function runTalentPartnerNavigation(context: InteractionContext) {
  try {
    await context.runWithContext('talent_partner', async (page) => {
      if (PERF_MODE === 'mock') {
        await installTalentPartnerApiMocks(page, {
          trialId: context.ids.trialId,
          createTrialId: context.ids.createdTrialId,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          dashboardDelayMs: 550,
        });
      }
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const trialLink = page
        .locator(`a[href="/dashboard/trials/${context.ids.trialId}"]`)
        .first();
      await waitForAnyVisible([
        () => expect(trialLink).toBeVisible({ timeout: 12_000 }),
        () =>
          expect(
            page.locator('a[href^="/dashboard/trials/"]').first(),
          ).toBeVisible({ timeout: 12_000 }),
      ]);
      const navStart = Date.now();
      await Promise.all([
        page.waitForURL(/\/dashboard\/trials\/[^/]+$/),
        (await trialLink.isVisible())
          ? trialLink.click()
          : page.locator('a[href^="/dashboard/trials/"]').first().click(),
      ]);
      await expect(page.getByText(/5-day trial plan/i)).toBeVisible();
      context.pushSuccess(
        'TalentPartner navigation latency (dashboard -> trial detail)',
        Date.now() - navStart,
      );
    });
  } catch (error) {
    context.pushFailure(
      'TalentPartner navigation latency (dashboard -> trial detail)',
      error,
    );
  }
}
