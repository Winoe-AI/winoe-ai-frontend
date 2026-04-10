import { expect } from '@playwright/test';
import { installTalentPartnerApiMocks } from '../../fixtures/talent-partnerMocks';
import { PERF_MODE } from '../config';
import { waitForAnyVisible } from '../helpers';
import type { InteractionContext } from './context';

export async function runWinoeReportControls(context: InteractionContext) {
  try {
    await context.runWithContext('talent_partner', async (page) => {
      if (PERF_MODE === 'mock') {
        await installTalentPartnerApiMocks(page, {
          trialId: context.ids.trialId,
          createTrialId: context.ids.createdTrialId,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          winoeReportPayload: { status: 'not_started' },
        });
      }
      await page.goto(
        `/dashboard/trials/${encodeURIComponent(context.ids.trialId)}/candidates/${encodeURIComponent(context.ids.candidateSessionId)}/winoe-report`,
        { waitUntil: 'domcontentloaded' },
      );
      await expect(
        page.getByRole('heading', { name: /winoe report/i }),
      ).toBeVisible({ timeout: 12_000 });
      const generate = page.getByRole('button', {
        name: /generate winoe report/i,
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
            expect(page.getByText(/generating winoe report/i)).toBeVisible({
              timeout: 12_000,
            }),
          () => expect(reload).toBeVisible({ timeout: 12_000 }),
        ]);
        context.pushSuccess(
          'Winoe Report interactive controls latency',
          Date.now() - start,
        );
      } else {
        await expect(reload).toBeVisible({ timeout: 12_000 });
        const start = Date.now();
        await Promise.all([
          page.waitForResponse(
            (response) =>
              response.url().includes('/api/candidate_sessions/') &&
              response.url().includes('/winoe_report') &&
              response.request().method() === 'GET',
            { timeout: 12_000 },
          ),
          reload.click(),
        ]).catch(async () => page.waitForTimeout(400));
        context.pushSuccess(
          'Winoe Report interactive controls latency',
          Date.now() - start,
        );
      }
    });
  } catch (error) {
    context.pushFailure('Winoe Report interactive controls latency', error);
  }
}
