import { expect } from '@playwright/test';
import { installRecruiterApiMocks } from '../../fixtures/recruiterMocks';
import { PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runSubmissionsExpand(context: InteractionContext) {
  try {
    await context.runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') {
        await installRecruiterApiMocks(page, { simulationId: context.ids.simulationId, createSimulationId: context.ids.createdSimulationId, candidateSessionId: Number.parseInt(context.ids.candidateSessionId, 10) || 77 });
      }
      await page.goto(`/dashboard/simulations/${encodeURIComponent(context.ids.simulationId)}/candidates/${encodeURIComponent(context.ids.candidateSessionId)}`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /submissions/i })).toBeVisible({ timeout: 12_000 });
      const showAll = page.getByRole('button', { name: /show all/i });
      await expect(showAll).toBeVisible({ timeout: 12_000 });
      const expandListStart = Date.now();
      await showAll.click();
      await expect(page.getByRole('button', { name: /hide list/i })).toBeVisible();
      context.pushSuccess('Submissions list expand latency', Date.now() - expandListStart);
      const expandButton = page.getByRole('button', { name: /^expand$/i }).first();
      await expect(expandButton).toBeVisible({ timeout: 12_000 });
      const expandStart = Date.now();
      await expandButton.click();
      await expect(page.getByRole('button', { name: /^collapse$/i }).first()).toBeVisible();
      context.pushSuccess('Submissions expand latency', Date.now() - expandStart);
      const collapseButton = page.getByRole('button', { name: /^collapse$/i }).first();
      const collapseStart = Date.now();
      await collapseButton.click();
      await expect(page.getByRole('button', { name: /^expand$/i }).first()).toBeVisible();
      context.pushSuccess('Submissions collapse latency', Date.now() - collapseStart);
    });
  } catch (error) {
    context.pushFailure('Submissions list expand latency', error);
    context.pushFailure('Submissions expand latency', error);
    context.pushFailure('Submissions collapse latency', error);
  }
}
