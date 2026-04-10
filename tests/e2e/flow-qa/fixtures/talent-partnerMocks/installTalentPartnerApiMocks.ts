import type { Page } from '@playwright/test';
import { buildDefaultArtifacts } from './defaultsArtifacts';
import {
  buildDefaultCandidates,
  buildDefaultCompareRows,
  buildDefaultTrials,
} from './defaultsCore';
import { buildDefaultWinoeReportPayload } from './defaultsWinoeReport';
import { buildDefaultSubmissions } from './defaultsSubmissions';
import { fulfillJson } from './shared';
import { handleDashboardAndTrialRoutes } from './routeDashboardTrials';
import { handleInviteAndTerminateRoutes } from './routeInviteTerminate';
import { handleSubmissionsRoutes } from './routeSubmissions';
import { handleWinoeReportRoutes } from './routeWinoeReport';
import {
  defaultCandidateSessionId,
  defaultTrialId,
  type TalentPartnerMockOptions,
  type TalentPartnerMockState,
} from './types';

export async function installTalentPartnerApiMocks(
  page: Page,
  options: TalentPartnerMockOptions = {},
): Promise<TalentPartnerMockState> {
  const trialId = options.trialId ?? defaultTrialId;
  const candidateSessionId =
    options.candidateSessionId ?? defaultCandidateSessionId;
  const state: TalentPartnerMockState = {
    trialId,
    candidateSessionId,
    inviteRequestCount: 0,
    resendInviteCount: 0,
  };
  const data = {
    trials: options.trials ?? buildDefaultTrials(trialId),
    candidates:
      options.candidates ?? buildDefaultCandidates(candidateSessionId),
    compareRows:
      options.compareRows ?? buildDefaultCompareRows(candidateSessionId),
    submissions:
      options.submissions ?? buildDefaultSubmissions(candidateSessionId),
    artifacts:
      options.artifactsBySubmissionId ??
      buildDefaultArtifacts(candidateSessionId),
    createTrialId: options.createTrialId ?? 'trial-created-900',
    winoeReportPayload:
      options.winoeReportPayload ??
      buildDefaultWinoeReportPayload(candidateSessionId),
  };

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const pathname = new URL(request.url()).pathname;
    const ctx = { route, request, method, pathname, options, state, data };
    if (await handleDashboardAndTrialRoutes(ctx)) return;
    if (await handleInviteAndTerminateRoutes(ctx)) return;
    if (await handleSubmissionsRoutes(ctx)) return;
    if (await handleWinoeReportRoutes(ctx)) return;
    await fulfillJson(
      route,
      { message: `Unhandled QA mock route: ${method} ${pathname}` },
      404,
    );
  });

  return state;
}
