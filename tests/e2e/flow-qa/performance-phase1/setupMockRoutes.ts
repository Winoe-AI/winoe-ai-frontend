import type { Page } from '@playwright/test';
import {
  installCandidateInvitesMocks,
  installCandidateSessionMocks,
  makeCandidateTask,
} from '../fixtures/candidateMocks';
import { installTalentPartnerApiMocks } from '../fixtures/talent-partnerMocks';
import { PERF_MODE } from './config';
import type { RouteGroup, RuntimeIds } from './types';

export async function setupMockRoutesForGroup(
  page: Page,
  group: RouteGroup,
  ids: RuntimeIds,
) {
  if (PERF_MODE !== 'mock') return;
  const candidateSessionId = Number.parseInt(ids.candidateSessionId, 10) || 77;
  if (group === 'talent_partner') {
    await installTalentPartnerApiMocks(page, {
      trialId: ids.trialId,
      createTrialId: ids.createdTrialId,
      candidateSessionId,
      dashboardDelayMs: 550,
    });
    return;
  }
  if (group === 'candidateDashboard') {
    await installCandidateInvitesMocks(page, { delayMs: 350 });
    return;
  }
  if (group === 'candidateSession') {
    await installCandidateSessionMocks(page, {
      token: ids.inviteToken,
      candidateSessionId,
      initialTask: makeCandidateTask({
        id: 1,
        dayIndex: 1,
        type: 'design',
        title: 'Architecture brief',
        description: 'Write your architecture plan.',
      }),
      completedTaskIds: [],
    });
  }
}
