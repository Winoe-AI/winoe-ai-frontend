import { expect } from '@playwright/test';
import { installCandidateDay4HandoffMocks } from '../../fixtures/candidateMocks';
import { PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runDay4Upload(context: InteractionContext) {
  try {
    await context.runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateDay4HandoffMocks(page, {
          token: context.ids.inviteToken,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          taskId: 4,
        });
      }
      await page.goto(
        `/candidate/session/${encodeURIComponent(context.ids.inviteToken)}`,
        { waitUntil: 'domcontentloaded' },
      );
      await page
        .getByRole('button', { name: /start trial/i })
        .click({ timeout: 5_000 })
        .catch(() => {});
      await expect(
        page.getByRole('button', { name: /upload video/i }),
      ).toBeVisible({ timeout: 12_000 });
      const progressStart = Date.now();
      await page.locator('input[type="file"]').setInputFiles({
        name: 'qa-sample.mp4',
        mimeType: 'video/mp4',
        buffer: Buffer.from('winoe-qa-video-content'),
      });
      await expect(page.getByText(/complete upload/i).first()).toBeVisible({
        timeout: 12_000,
      });
      context.pushSuccess(
        'Day 4 upload progress latency',
        Date.now() - progressStart,
      );
      const finalizeStart = Date.now();
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /^complete upload$/i }).click();
      await expect(page.getByText(/transcript ready/i)).toBeVisible({
        timeout: 15_000,
      });
      context.pushSuccess(
        'Day 4 upload finalization latency',
        Date.now() - finalizeStart,
      );
    });
  } catch (error) {
    context.pushFailure('Day 4 upload progress latency', error);
    context.pushFailure('Day 4 upload finalization latency', error);
  }
}
