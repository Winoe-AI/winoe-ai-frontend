import { expect } from '@playwright/test';
import { installCandidateSessionMocks, makeCandidateTask } from '../../fixtures/candidateMocks';
import { PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runDay1Keystroke(context: InteractionContext) {
  try {
    await context.runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateSessionMocks(page, {
          token: context.ids.inviteToken,
          candidateSessionId: Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          initialTask: makeCandidateTask({ id: 1, dayIndex: 1, type: 'design', title: 'Architecture brief', description: 'Write your architecture plan.' }),
          completedTaskIds: [],
        });
      }
      await page.goto(`/candidate/session/${encodeURIComponent(context.ids.inviteToken)}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /start simulation/i }).click({ timeout: 5_000 }).catch(() => {});
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 12_000 });
      const start = Date.now();
      await textarea.type('Performance keystroke sample for Day 1.', { delay: 0 });
      context.pushSuccess('Day 1 keystroke latency', Date.now() - start);
    });
  } catch (error) {
    context.pushFailure('Day 1 keystroke latency', error);
  }
}
