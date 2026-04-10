import { expect } from '@playwright/test';
import { installTalentPartnerApiMocks } from '../../fixtures/talent-partnerMocks';
import { ALLOW_LIVE_CREATE_MUTATION, PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runTrialCreate(context: InteractionContext) {
  try {
    await context.runWithContext('talent_partner', async (page) => {
      if (PERF_MODE === 'mock')
        await installTalentPartnerApiMocks(page, {
          trialId: context.ids.trialId,
          createTrialId: context.ids.createdTrialId,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
        });
      await page.goto('/dashboard/trials/new', {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page.getByRole('heading', { name: /new trial/i }),
      ).toBeVisible();
      const titleField = page.getByLabel(/title/i);
      await titleField.fill('');
      const submitStart = Date.now();
      if (PERF_MODE === 'live' && !ALLOW_LIVE_CREATE_MUTATION) {
        await page.getByRole('button', { name: /create trial/i }).click();
        await expect(page.getByText(/title is required/i)).toBeVisible();
      } else {
        await titleField.fill(`Perf Sample ${context.sample}-${Date.now()}`);
        await Promise.race([
          Promise.all([
            page.waitForURL(/\/dashboard\/trials\/[^/]+$/),
            page.getByRole('button', { name: /create trial/i }).click(),
          ]),
          Promise.all([
            page.getByRole('button', { name: /create trial/i }).click(),
            page
              .getByRole('alert')
              .first()
              .waitFor({ state: 'visible', timeout: 12_000 }),
          ]),
        ]);
      }
      context.pushSuccess(
        'Trial create submit-feedback latency',
        Date.now() - submitStart,
      );
    });
  } catch (error) {
    context.pushFailure('Trial create submit-feedback latency', error);
  }
}
