import type { Page } from '@playwright/test';
import type {
  CandidateSessionMockOptions,
  CandidateSessionMockState,
} from './types';
import { fulfillJson } from './shared';
import { handleSessionCoreRoute } from './sessionCoreRoutes';
import { handleSessionWorkspaceRunRoute } from './sessionWorkspaceRunRoutes';

export async function installCandidateSessionMocks(
  page: Page,
  options: CandidateSessionMockOptions,
): Promise<CandidateSessionMockState> {
  const token = options.token ?? 'test-token';
  const candidateSessionId = options.candidateSessionId ?? 77;
  const simulationTitle =
    options.simulationTitle ?? 'Frontend Platform Modernization';
  const simulationRole = options.simulationRole ?? 'Senior Frontend Engineer';
  const runStatusSequence = options.runStatusSequence ?? [
    {
      status: 'passed',
      passed: 12,
      failed: 0,
      total: 12,
      stdout: 'All tests passed.',
      workflowUrl: 'https://github.com/tenon-ai/candidate-repo/actions/runs/1',
      commitSha: 'abc1234def5678',
    },
  ];

  let submitted = false;
  let runPollCount = 0;
  const state: CandidateSessionMockState = {
    token,
    candidateSessionId,
    submitCount: 0,
    runPollCount: 0,
  };

  await page.route('**/api/backend/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const pathname = new URL(request.url()).pathname;

    const core = await handleSessionCoreRoute(route, method, pathname, {
      token,
      candidateSessionId,
      simulationTitle,
      simulationRole,
      submitted,
      options,
      state,
    });
    submitted = core.submitted;
    if (core.handled) return;

    const extra = await handleSessionWorkspaceRunRoute(
      route,
      method,
      pathname,
      {
        candidateSessionId,
        workspaceStatus: options.workspaceStatus,
        runStatusSequence,
        runPollCount,
      },
    );
    runPollCount = extra.runPollCount;
    state.runPollCount = runPollCount;
    if (extra.handled) return;

    await fulfillJson(
      route,
      { message: `Unhandled candidate mock route: ${method} ${pathname}` },
      404,
    );
  });

  return state;
}
