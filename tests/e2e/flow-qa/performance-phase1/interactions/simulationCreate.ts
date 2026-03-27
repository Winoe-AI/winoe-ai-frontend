import { expect } from '@playwright/test';
import { installRecruiterApiMocks } from '../../fixtures/recruiterMocks';
import { ALLOW_LIVE_CREATE_MUTATION, PERF_MODE } from '../config';
import type { InteractionContext } from './context';

export async function runSimulationCreate(context: InteractionContext) {
  try {
    await context.runWithContext('recruiter', async (page) => {
      if (PERF_MODE === 'mock') await installRecruiterApiMocks(page, { simulationId: context.ids.simulationId, createSimulationId: context.ids.createdSimulationId, candidateSessionId: Number.parseInt(context.ids.candidateSessionId, 10) || 77 });
      await page.goto('/dashboard/simulations/new', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /new simulation/i })).toBeVisible();
      const titleField = page.getByLabel(/title/i);
      await titleField.fill('');
      const submitStart = Date.now();
      if (PERF_MODE === 'live' && !ALLOW_LIVE_CREATE_MUTATION) {
        await page.getByRole('button', { name: /create simulation/i }).click();
        await expect(page.getByText(/title is required/i)).toBeVisible();
      } else {
        await titleField.fill(`Perf Sample ${context.sample}-${Date.now()}`);
        await Promise.race([
          Promise.all([page.waitForURL(/\/dashboard\/simulations\/[^/]+$/), page.getByRole('button', { name: /create simulation/i }).click()]),
          Promise.all([page.getByRole('button', { name: /create simulation/i }).click(), page.getByRole('alert').first().waitFor({ state: 'visible', timeout: 12_000 })]),
        ]);
      }
      context.pushSuccess('Simulation create submit-feedback latency', Date.now() - submitStart);
    });
  } catch (error) {
    context.pushFailure('Simulation create submit-feedback latency', error);
  }
}
