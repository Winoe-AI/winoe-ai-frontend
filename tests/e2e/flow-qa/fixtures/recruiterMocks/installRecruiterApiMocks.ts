import type { Page } from '@playwright/test';
import { buildDefaultArtifacts } from './defaultsArtifacts';
import {
  buildDefaultCandidates,
  buildDefaultCompareRows,
  buildDefaultSimulations,
} from './defaultsCore';
import { buildDefaultFitProfilePayload } from './defaultsFitProfile';
import { buildDefaultSubmissions } from './defaultsSubmissions';
import { fulfillJson } from './shared';
import { handleDashboardAndSimulationRoutes } from './routeDashboardSimulations';
import { handleInviteAndTerminateRoutes } from './routeInviteTerminate';
import { handleSubmissionsRoutes } from './routeSubmissions';
import { handleFitProfileRoutes } from './routeFitProfile';
import {
  defaultCandidateSessionId,
  defaultSimulationId,
  type RecruiterMockOptions,
  type RecruiterMockState,
} from './types';

export async function installRecruiterApiMocks(
  page: Page,
  options: RecruiterMockOptions = {},
): Promise<RecruiterMockState> {
  const simulationId = options.simulationId ?? defaultSimulationId;
  const candidateSessionId =
    options.candidateSessionId ?? defaultCandidateSessionId;
  const state: RecruiterMockState = {
    simulationId,
    candidateSessionId,
    inviteRequestCount: 0,
    resendInviteCount: 0,
  };
  const data = {
    simulations: options.simulations ?? buildDefaultSimulations(simulationId),
    candidates:
      options.candidates ?? buildDefaultCandidates(candidateSessionId),
    compareRows:
      options.compareRows ?? buildDefaultCompareRows(candidateSessionId),
    submissions:
      options.submissions ?? buildDefaultSubmissions(candidateSessionId),
    artifacts:
      options.artifactsBySubmissionId ??
      buildDefaultArtifacts(candidateSessionId),
    createSimulationId: options.createSimulationId ?? 'sim-created-900',
    fitProfilePayload:
      options.fitProfilePayload ??
      buildDefaultFitProfilePayload(candidateSessionId),
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const pathname = new URL(request.url()).pathname;
    const ctx = { route, request, method, pathname, options, state, data };
    if (await handleDashboardAndSimulationRoutes(ctx)) return;
    if (await handleInviteAndTerminateRoutes(ctx)) return;
    if (await handleSubmissionsRoutes(ctx)) return;
    if (await handleFitProfileRoutes(ctx)) return;
    await fulfillJson(
      route,
      { message: `Unhandled QA mock route: ${method} ${pathname}` },
      404,
    );
  });

  return state;
}
