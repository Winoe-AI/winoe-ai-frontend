import type { Route } from '@playwright/test';
import type { Day4HandoffMockState } from './types';
import { fulfillJson } from './shared';
import { buildDay4StatusBody } from './day4Status';

export async function handleDay4BackendRoute(
  route: Route,
  params: {
    pathname: string;
    method: string;
    token: string;
    candidateSessionId: number;
    taskId: number;
    completed: boolean;
    deleted: boolean;
    statusAfterCompleteCalls: number;
    state: Day4HandoffMockState;
  },
) {
  if (params.pathname.endsWith(`/candidate/session/${params.token}`)) {
    await fulfillJson(route, {
      candidateSessionId: params.candidateSessionId,
      status: 'in_progress',
      trial: {
        title: 'Frontend Platform Modernization',
        role: 'Senior Frontend Engineer',
      },
    });
    return { handled: true, ...params };
  }
  if (
    params.pathname.endsWith(
      `/candidate/session/${params.candidateSessionId}/current_task`,
    )
  ) {
    await fulfillJson(route, {
      isComplete: false,
      completedTaskIds: [1, 2, 3],
      currentTask: {
        id: params.taskId,
        dayIndex: 4,
        type: 'handoff',
        title: 'Handoff demo',
        description: 'Upload your walkthrough video.',
      },
    });
    return { handled: true, ...params };
  }
  if (params.pathname.endsWith(`/tasks/${params.taskId}/handoff/upload/init`)) {
    params.state.initBody = route.request().postDataJSON() as Record<
      string,
      unknown
    >;
    await fulfillJson(route, {
      recordingId: 'rec_123',
      uploadUrl: 'https://storage.example.com/signed',
      expiresInSeconds: 900,
    });
    return { handled: true, ...params };
  }
  if (
    params.pathname.endsWith(`/tasks/${params.taskId}/handoff/upload/complete`)
  ) {
    params.state.completeBody = route.request().postDataJSON() as Record<
      string,
      unknown
    >;
    await fulfillJson(route, { recordingId: 'rec_123', status: 'uploaded' });
    return { handled: true, ...params, completed: true };
  }
  if (params.pathname.endsWith(`/tasks/${params.taskId}/handoff/status`)) {
    const nextCount = params.completed
      ? params.statusAfterCompleteCalls + 1
      : params.statusAfterCompleteCalls;
    await fulfillJson(
      route,
      buildDay4StatusBody({
        deleted: params.deleted,
        completed: params.completed,
        statusAfterCompleteCalls: nextCount,
      }),
    );
    return { handled: true, ...params, statusAfterCompleteCalls: nextCount };
  }
  if (
    (params.method === 'DELETE' &&
      params.pathname.endsWith(`/tasks/${params.taskId}/handoff`)) ||
    (params.method === 'POST' &&
      /\/recordings\/[^/]+\/delete$/.test(params.pathname))
  ) {
    await fulfillJson(route, {
      deleted: true,
      deletedAt: '2026-03-16T10:10:00.000Z',
      status: 'deleted',
    });
    return { handled: true, ...params, deleted: true };
  }
  return { handled: false, ...params };
}
