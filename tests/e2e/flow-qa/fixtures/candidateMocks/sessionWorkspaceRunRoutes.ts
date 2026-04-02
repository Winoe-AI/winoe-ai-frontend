import type { Route } from '@playwright/test';
import type { PollStatusMock } from './types';
import { fulfillJson, nowIso, withDefaults } from './shared';

export async function handleSessionWorkspaceRunRoute(
  route: Route,
  method: string,
  pathname: string,
  params: {
    candidateSessionId: number;
    workspaceStatus?: Record<string, unknown>;
    runStatusSequence: PollStatusMock[];
    runPollCount: number;
  },
) {
  if (pathname.endsWith('/codespace/status') && method === 'GET') {
    await fulfillJson(route, {
      repoName: 'candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      codespaceUrl: 'https://github.com/codespaces/qa-e2e',
      codespaceState: 'ready',
      ...(params.workspaceStatus ?? {}),
    });
    return { handled: true, runPollCount: params.runPollCount };
  }
  if (pathname.endsWith('/codespace/init') && method === 'POST') {
    await fulfillJson(route, {
      repoName: 'candidate-repo',
      repoFullName: 'tenon-ai/candidate-repo',
      codespaceUrl: 'https://github.com/codespaces/qa-e2e',
      codespaceState: 'provisioning',
      ...(params.workspaceStatus ?? {}),
    });
    return { handled: true, runPollCount: params.runPollCount };
  }
  if (pathname.endsWith('/run') && method === 'POST') {
    await fulfillJson(route, { runId: 'run-qa-1' });
    return { handled: true, runPollCount: params.runPollCount };
  }
  if (
    /\/api\/backend\/tasks\/\d+\/run\/.+/.test(pathname) &&
    method === 'GET'
  ) {
    const next =
      params.runStatusSequence[
        Math.min(params.runPollCount, params.runStatusSequence.length - 1)
      ];
    await fulfillJson(route, withDefaults(next));
    return { handled: true, runPollCount: params.runPollCount + 1 };
  }
  if (
    /\/api\/backend\/candidate\/session\/[^/]+\/schedule$/.test(pathname) &&
    method === 'POST'
  ) {
    await fulfillJson(route, {
      candidateSessionId: params.candidateSessionId,
      scheduledStartAt: nowIso(),
      candidateTimezone: 'America/New_York',
      dayWindows: [],
      scheduleLockedAt: nowIso(),
    });
    return { handled: true, runPollCount: params.runPollCount };
  }
  return { handled: false, runPollCount: params.runPollCount };
}
