import { expect } from '@playwright/test';
import { installRecruiterApiMocks } from '../../fixtures/recruiterMocks';
import { PERF_MODE } from '../config';
import { waitForAnyVisible } from '../helpers';
import type { InteractionContext } from './context';

export async function runFitProfileControls(context: InteractionContext) {
  try {
    await context.runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, {
          simulationId: context.ids.simulationId,
          createSimulationId: context.ids.createdSimulationId,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          fitProfilePayload: { status: 'not_started' },
        });
      }
      await page.goto(
        `/dashboard/simulations/${encodeURIComponent(context.ids.simulationId)}/candidates/${encodeURIComponent(context.ids.candidateSessionId)}/fit-profile`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(
        page.getByRole('heading', { name: /fit profile/i }),
      ).toBeVisible({ timeout: 12_000 });
      const generate = page.getByRole('button', {
        name: /generate fit profile/i,
      });
      const reload = page
        .getByRole('button', { name: /reload|refresh/i })
        .first();
      if (
        (await generate.count()) > 0 &&
        (await generate.isVisible().catch(() => false))
      ) {
        const start = Date.now();
        await generate.click();
        await waitForAnyVisible([
          () =>
            expect(page.getByText(/generating fit profile/i)).toBeVisible({
              timeout: 12_000,
            }),
          () => expect(reload).toBeVisible({ timeout: 12_000 }),
        ]);
        context.pushSuccess(
          'Fit-profile interactive controls latency',
          Date.now() - start,
        );
      } else {
        await expect(reload).toBeVisible({ timeout: 12_000 });
        const start = Date.now();
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('/api/candidate_sessions/') &&
              response.url().includes('/fit_profile') &&
              response.request().method() === 'GET',
            { timeout: 12_000 },
          ),
          reload.click(),
        ]).catch(async () => page.waitForTimeout(400));
        context.pushSuccess(
          'Fit-profile interactive controls latency',
          Date.now() - start,
        );
      }
    });
  } catch (error) {
    context.pushFailure('Fit-profile interactive controls latency', error);
  }
}
