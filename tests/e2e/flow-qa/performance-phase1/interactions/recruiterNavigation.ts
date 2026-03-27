import { expect } from '@playwright/test';
import { installRecruiterApiMocks } from '../../fixtures/recruiterMocks';
import { PERF_MODE } from '../config';
import { waitForAnyVisible } from '../helpers';
import type { InteractionContext } from './context';

export async function runRecruiterNavigation(context: InteractionContext) {
  try {
    await context.runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: context.ids.simulationId,
          createSimulationId: context.ids.createdSimulationId,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          dashboardDelayMs: 550,
        });
      }
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
      const simulationLink = page
        .locator(`a[href="/dashboard/simulations/${context.ids.simulationId}"]`)
        .first();
      await waitForAnyVisible([
        () => expect(simulationLink).toBeVisible({ timeout: 12_000 }),
        () =>
          expect(
            page.locator('a[href^="/dashboard/simulations/"]').first(),
          ).toBeVisible({ timeout: 12_000 }),
      ]);
      const navStart = Date.now();
      await Promise.all([
        page.waitForURL(/\/dashboard\/simulations\/[^/]+$/),
        (await simulationLink.isVisible())
          ? simulationLink.click()
          : page.locator('a[href^="/dashboard/simulations/"]').first().click(),
      ]);
      await expect(page.getByText(/5-day simulation plan/i)).toBeVisible();
      context.pushSuccess(
        'Recruiter navigation latency (dashboard -> simulation detail)',
        Date.now() - navStart,
      );
    });
  } catch (error) {
    context.pushFailure(
      'Recruiter navigation latency (dashboard -> simulation detail)',
      error,
    );
  }
}
