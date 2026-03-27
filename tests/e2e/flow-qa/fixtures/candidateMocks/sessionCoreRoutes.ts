import type { Route } from '@playwright/test';
import type {
  CandidateSessionMockOptions,
  CandidateSessionMockState,
} from './types';
import { defaultCandidateInvites } from './invites';
import { fulfillJson, nowIso } from './shared';

export async function handleSessionCoreRoute(
  route: Route,
  method: string,
  pathname: string,
  params: {
    token: string;
    candidateSessionId: number;
    simulationTitle: string;
    simulationRole: string;
    submitted: boolean;
    options: CandidateSessionMockOptions;
    state: CandidateSessionMockState;
  },
) {
  if (
    pathname === `/api/backend/candidate/session/${params.token}` &&
    method === 'GET'
  ) {
    await fulfillJson(route, {
      candidateSessionId: params.candidateSessionId,
      status: params.options.isCompleteInitially ? 'completed' : 'in_progress',
      simulation: { title: params.simulationTitle, role: params.simulationRole },
    });
    return { handled: true, submitted: params.submitted };
  }
  if (pathname === '/api/backend/candidate/invites' && method === 'GET') {
    await fulfillJson(route, params.options.invites ?? defaultCandidateInvites());
    return { handled: true, submitted: params.submitted };
  }
  if (
    pathname === `/api/backend/candidate/session/${params.candidateSessionId}/current_task` &&
    method === 'GET'
  ) {
    const completed = params.submitted
      ? params.options.completedTaskIdsAfterSubmit ?? params.options.completedTaskIds ?? []
      : params.options.completedTaskIds ?? [];
    await fulfillJson(route, {
      isComplete: params.submitted ? (params.options.isCompleteAfterSubmit ?? false) : (params.options.isCompleteInitially ?? false),
      completedTaskIds: completed,
      currentTask: params.submitted ? (params.options.nextTaskAfterSubmit ?? params.options.initialTask) : params.options.initialTask,
    });
    return { handled: true, submitted: params.submitted };
  }
  if (pathname.endsWith('/submit') && method === 'POST') {
    params.state.submitCount += 1;
    const taskId = Number(pathname.split('/').slice(-2)[0] ?? 0);
    await fulfillJson(route, params.options.submitResponse ?? {
      submissionId: 900 + params.state.submitCount,
      taskId,
      candidateSessionId: params.candidateSessionId,
      submittedAt: nowIso(),
      progress: { completed: (params.options.completedTaskIdsAfterSubmit ?? params.options.completedTaskIds ?? []).length, total: 5 },
      isComplete: params.options.isCompleteAfterSubmit ?? false,
    });
    return { handled: true, submitted: true };
  }
  return { handled: false, submitted: params.submitted };
}
