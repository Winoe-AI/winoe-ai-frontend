import { expect } from '@playwright/test';
import {
  installCandidateSessionMocks,
  makeCandidateTask,
} from '../../fixtures/candidateMocks';
import { PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runDay5Keystroke(context: InteractionContext) {
  try {
    await context.runWithContext('candidate', async (page) => {
      if (PERF_MODE === 'mock') {
        await installCandidateSessionMocks(page, {
          token: context.ids.inviteToken,
          candidateSessionId:
            Number.parseInt(context.ids.candidateSessionId, 10) || 77,
          initialTask: makeCandidateTask({
            id: 5,
            dayIndex: 5,
            type: 'documentation',
            title: 'Final reflection',
            description: 'Capture your day-by-day reflection.',
          }),
          completedTaskIds: [1, 2, 3, 4],
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
      const textarea = page.locator('textarea').first();
      await expect(textarea).toBeVisible({ timeout: 12_000 });
      const start = Date.now();
      await textarea.type('Day 5 reflection keystroke sample.', { delay: 0 });
      context.pushSuccess('Day 5 keystroke latency', Date.now() - start);
    });
  } catch (error) {
    context.pushFailure('Day 5 keystroke latency', error);
  }
}
