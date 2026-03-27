import { expect, type Browser } from '@playwright/test';
import { BASE_URL, DEFAULT_IDS } from './config';
import { storagePath } from './helpers';
import type { RuntimeIds } from './types';

async function discoverRecruiterIds(
  browser: Browser,
  next: RuntimeIds,
  envSimulationId?: string,
  envCandidateSessionId?: string,
) {
  if (envSimulationId && envCandidateSessionId) return;
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: storagePath('recruiter'),
  });
  const page = await context.newPage();
  try {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /^dashboard$/i }),
    ).toBeVisible({ timeout: 12_000 });
    const discoveredSimulationId = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      for (const anchor of anchors) {
        const href = anchor.getAttribute('href');
        const match = href?.match(/^\/dashboard\/simulations\/([^/]+)$/);
        if (match?.[1] && match[1] !== 'new')
          return decodeURIComponent(match[1]);
      }
      return null;
    });
    if (discoveredSimulationId && !envSimulationId)
      next.simulationId = discoveredSimulationId;
    if (!next.simulationId) return;
    await page.goto(
      `/dashboard/simulations/${encodeURIComponent(next.simulationId)}`,
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page.getByText(/5-day simulation plan/i)).toBeVisible({
      timeout: 12_000,
    });
    const discoveredCandidateSessionId = await page.evaluate(() => {
      const row = document.querySelector(
        '[data-testid^="candidate-row-"]',
      ) as HTMLElement | null;
      const match = (row?.getAttribute('data-testid') || '').match(
        /^candidate-row-(.+)$/,
      );
      return match?.[1] ?? null;
    });
    if (discoveredCandidateSessionId && !envCandidateSessionId)
      next.candidateSessionId = discoveredCandidateSessionId;
  } catch {
    // keep defaults
  } finally {
    await context.close();
  }
}

async function discoverInviteToken(
  browser: Browser,
  next: RuntimeIds,
  envInviteToken?: string,
) {
  if (envInviteToken) return;
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: storagePath('candidate'),
  });
  const page = await context.newPage();
  try {
    await page.goto('/candidate/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('heading', { name: /candidate dashboard/i }),
    ).toBeVisible({ timeout: 12_000 });
    const continueButton = page
      .getByRole('button', { name: /start simulation|continue/i })
      .first();
    if ((await continueButton.count()) === 0) return;
    await Promise.all([
      page.waitForURL(/\/candidate\/session\/[^/?#]+/, { timeout: 12_000 }),
      continueButton.click(),
    ]);
    const match = new URL(page.url()).pathname.match(
      /\/candidate\/session\/([^/]+)$/,
    );
    if (match?.[1]) next.inviteToken = decodeURIComponent(match[1]);
  } catch {
    // keep default token
  } finally {
    await context.close();
  }
}

export async function discoverLiveIds(browser: Browser): Promise<RuntimeIds> {
  const next: RuntimeIds = { ...DEFAULT_IDS };
  const envSimulationId = process.env.TENON_PERF_SIMULATION_ID?.trim();
  const envCandidateSessionId =
    process.env.TENON_PERF_CANDIDATE_SESSION_ID?.trim();
  const envInviteToken = process.env.TENON_PERF_INVITE_TOKEN?.trim();
  if (envSimulationId) next.simulationId = envSimulationId;
  if (envCandidateSessionId) next.candidateSessionId = envCandidateSessionId;
  if (envInviteToken) next.inviteToken = envInviteToken;
  await discoverRecruiterIds(
    browser,
    next,
    envSimulationId,
    envCandidateSessionId,
  );
  await discoverInviteToken(browser, next, envInviteToken);
  return next;
}
