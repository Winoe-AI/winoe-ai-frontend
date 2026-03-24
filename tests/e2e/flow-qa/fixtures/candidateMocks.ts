import type { Page, Route } from '@playwright/test';

export type CandidateTaskMock = {
  id: number;
  dayIndex: number;
  type: string;
  title: string;
  description: string;
  recordedSubmission?: {
    submissionId: number;
    submittedAt: string;
    contentText?: string | null;
    contentJson?: Record<string, unknown> | null;
  } | null;
};

export type PollStatusMock = {
  status: 'running' | 'passed' | 'failed' | 'timeout' | 'error';
  message?: string;
  passed?: number | null;
  failed?: number | null;
  total?: number | null;
  stdout?: string | null;
  stderr?: string | null;
  workflowUrl?: string | null;
  commitSha?: string | null;
};

type CandidateSessionMockOptions = {
  token?: string;
  candidateSessionId?: number;
  simulationTitle?: string;
  simulationRole?: string;
  initialTask: CandidateTaskMock | null;
  nextTaskAfterSubmit?: CandidateTaskMock | null;
  completedTaskIds?: number[];
  completedTaskIdsAfterSubmit?: number[];
  isCompleteInitially?: boolean;
  isCompleteAfterSubmit?: boolean;
  submitResponse?: Record<string, unknown>;
  workspaceStatus?: Record<string, unknown>;
  runStatusSequence?: PollStatusMock[];
  invites?: Array<Record<string, unknown>>;
};

type CandidateSessionMockState = {
  token: string;
  candidateSessionId: number;
  submitCount: number;
  runPollCount: number;
};

type Day4HandoffMockState = {
  completeBody: Record<string, unknown> | null;
  initBody: Record<string, unknown> | null;
};

type CandidateInvitesMockOptions = {
  invites?: Array<Record<string, unknown>>;
  status?: number;
  message?: string;
  delayMs?: number;
};

function nowIso() {
  return new Date().toISOString();
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function withDefaults(result: PollStatusMock): Record<string, unknown> {
  return {
    status: result.status,
    message: result.message,
    passed: result.passed ?? null,
    failed: result.failed ?? null,
    total: result.total ?? null,
    stdout: result.stdout ?? null,
    stderr: result.stderr ?? null,
    workflowUrl: result.workflowUrl ?? null,
    commitSha: result.commitSha ?? null,
  };
}

export function makeCandidateTask(
  params: Pick<
    CandidateTaskMock,
    'id' | 'dayIndex' | 'type' | 'title' | 'description'
  > & {
    recordedSubmission?: CandidateTaskMock['recordedSubmission'];
  },
): CandidateTaskMock {
  return {
    id: params.id,
    dayIndex: params.dayIndex,
    type: params.type,
    title: params.title,
    description: params.description,
    recordedSubmission: params.recordedSubmission ?? null,
  };
}

export function defaultCandidateInvites() {
  return [
    {
      candidateSessionId: 77,
      token: 'test-token',
      title: 'Frontend Platform Modernization',
      role: 'Senior Frontend Engineer',
      status: 'in_progress',
      progress: { completed: 2, total: 5 },
      expiresAt: null,
      lastActivityAt: '2026-03-18T10:00:00.000Z',
      isExpired: false,
    },
  ];
}

export async function installCandidateInvitesMocks(
  page: Page,
  options: CandidateInvitesMockOptions = {},
) {
  await page.route('**/api/backend/candidate/invites**', async (route) => {
    const request = route.request();
    if (request.method().toUpperCase() !== 'GET') {
      await fulfillJson(
        route,
        {
          message: `Unhandled method for invites mock: ${request.method()}`,
        },
        405,
      );
      return;
    }

    if (options.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    if ((options.status ?? 200) >= 400) {
      await fulfillJson(
        route,
        { message: options.message ?? 'Unable to load invites.' },
        options.status ?? 500,
      );
      return;
    }

    await fulfillJson(route, options.invites ?? defaultCandidateInvites(), 200);
  });
}

export async function installCandidateSessionMocks(
  page: Page,
  options: CandidateSessionMockOptions,
): Promise<CandidateSessionMockState> {
  const token = options.token ?? 'test-token';
  const candidateSessionId = options.candidateSessionId ?? 77;
  const simulationTitle =
    options.simulationTitle ?? 'Frontend Platform Modernization';
  const simulationRole = options.simulationRole ?? 'Senior Frontend Engineer';

  let submitted = false;
  let runPollCount = 0;
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

  const state: CandidateSessionMockState = {
    token,
    candidateSessionId,
    submitCount: 0,
    runPollCount: 0,
  };

  await page.route('**/api/backend/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const pathname = url.pathname;

    if (
      pathname === `/api/backend/candidate/session/${token}` &&
      method === 'GET'
    ) {
      const bootstrapStatus = options.isCompleteInitially
        ? 'completed'
        : 'in_progress';
      await fulfillJson(route, {
        candidateSessionId,
        status: bootstrapStatus,
        simulation: {
          title: simulationTitle,
          role: simulationRole,
        },
      });
      return;
    }

    if (pathname === '/api/backend/candidate/invites' && method === 'GET') {
      await fulfillJson(route, options.invites ?? defaultCandidateInvites());
      return;
    }

    if (
      pathname ===
        `/api/backend/candidate/session/${candidateSessionId}/current_task` &&
      method === 'GET'
    ) {
      const isComplete = submitted
        ? (options.isCompleteAfterSubmit ?? false)
        : (options.isCompleteInitially ?? false);
      const currentTask = submitted
        ? (options.nextTaskAfterSubmit ?? options.initialTask)
        : options.initialTask;
      const completedTaskIds = submitted
        ? (options.completedTaskIdsAfterSubmit ??
          options.completedTaskIds ??
          [])
        : (options.completedTaskIds ?? []);

      await fulfillJson(route, {
        isComplete,
        completedTaskIds,
        currentTask,
      });
      return;
    }

    if (pathname.endsWith('/submit') && method === 'POST') {
      submitted = true;
      state.submitCount += 1;
      const taskId = Number(pathname.split('/').slice(-2)[0] ?? 0);
      const submitResponse = options.submitResponse ?? {
        submissionId: 900 + state.submitCount,
        taskId,
        candidateSessionId,
        submittedAt: nowIso(),
        progress: {
          completed: (
            options.completedTaskIdsAfterSubmit ??
            options.completedTaskIds ??
            []
          ).length,
          total: 5,
        },
        isComplete: options.isCompleteAfterSubmit ?? false,
      };
      await fulfillJson(route, submitResponse);
      return;
    }

    if (pathname.endsWith('/codespace/status') && method === 'GET') {
      await fulfillJson(route, {
        repoUrl: 'https://github.com/tenon-ai/candidate-repo',
        repoName: 'candidate-repo',
        repoFullName: 'tenon-ai/candidate-repo',
        codespaceUrl: 'https://github.com/codespaces/qa-e2e',
        codespaceState: 'ready',
        ...(options.workspaceStatus ?? {}),
      });
      return;
    }

    if (pathname.endsWith('/codespace/init') && method === 'POST') {
      await fulfillJson(route, {
        repoUrl: 'https://github.com/tenon-ai/candidate-repo',
        repoName: 'candidate-repo',
        repoFullName: 'tenon-ai/candidate-repo',
        codespaceUrl: 'https://github.com/codespaces/qa-e2e',
        codespaceState: 'provisioning',
        ...(options.workspaceStatus ?? {}),
      });
      return;
    }

    if (pathname.endsWith('/run') && method === 'POST') {
      await fulfillJson(route, { runId: 'run-qa-1' });
      return;
    }

    if (
      /\/api\/backend\/tasks\/\d+\/run\/.+/.test(pathname) &&
      method === 'GET'
    ) {
      const next =
        runStatusSequence[Math.min(runPollCount, runStatusSequence.length - 1)];
      runPollCount += 1;
      state.runPollCount = runPollCount;
      await fulfillJson(route, withDefaults(next));
      return;
    }

    if (
      /\/api\/backend\/candidate\/session\/[^/]+\/schedule$/.test(pathname) &&
      method === 'POST'
    ) {
      await fulfillJson(route, {
        candidateSessionId,
        scheduledStartAt: nowIso(),
        candidateTimezone: 'America/New_York',
        dayWindows: [],
        scheduleLockedAt: nowIso(),
      });
      return;
    }

    await fulfillJson(
      route,
      { message: `Unhandled candidate mock route: ${method} ${pathname}` },
      404,
    );
  });

  return state;
}

export async function installCandidateDay4HandoffMocks(
  page: Page,
  options?: {
    token?: string;
    candidateSessionId?: number;
    taskId?: number;
  },
): Promise<Day4HandoffMockState> {
  const token = options?.token ?? 'test-token';
  const candidateSessionId = options?.candidateSessionId ?? 77;
  const taskId = options?.taskId ?? 4;

  let statusAfterCompleteCalls = 0;
  let completed = false;
  let deleted = false;

  const state: Day4HandoffMockState = {
    completeBody: null,
    initBody: null,
  };

  await page.route('**/api/backend/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.endsWith(`/candidate/session/${token}`)) {
      await fulfillJson(route, {
        candidateSessionId,
        status: 'in_progress',
        simulation: {
          title: 'Frontend Platform Modernization',
          role: 'Senior Frontend Engineer',
        },
      });
      return;
    }

    if (
      pathname.endsWith(`/candidate/session/${candidateSessionId}/current_task`)
    ) {
      await fulfillJson(route, {
        isComplete: false,
        completedTaskIds: [1, 2, 3],
        currentTask: {
          id: taskId,
          dayIndex: 4,
          type: 'handoff',
          title: 'Handoff demo',
          description: 'Upload your walkthrough video.',
        },
      });
      return;
    }

    if (pathname.endsWith(`/tasks/${taskId}/handoff/upload/init`)) {
      state.initBody = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(route, {
        recordingId: 'rec_123',
        uploadUrl: 'https://storage.example.com/signed',
        expiresInSeconds: 900,
      });
      return;
    }

    if (pathname.endsWith(`/tasks/${taskId}/handoff/upload/complete`)) {
      state.completeBody = request.postDataJSON() as Record<string, unknown>;
      completed = true;
      await fulfillJson(route, {
        recordingId: 'rec_123',
        status: 'uploaded',
      });
      return;
    }

    if (pathname.endsWith(`/tasks/${taskId}/handoff/status`)) {
      let body: Record<string, unknown>;
      if (deleted) {
        body = {
          recording: null,
          transcript: null,
          isDeleted: true,
          deletedAt: '2026-03-16T10:10:00.000Z',
          recordingStatus: 'deleted',
          transcriptStatus: 'deleted',
        };
      } else if (!completed) {
        body = {
          recording: null,
          transcript: null,
        };
      } else {
        statusAfterCompleteCalls += 1;
        body =
          statusAfterCompleteCalls === 1
            ? {
                recording: {
                  recordingId: 'rec_123',
                  status: 'uploaded',
                  downloadUrl: 'https://cdn.example.com/rec_123.mp4',
                },
                transcript: {
                  status: 'processing',
                  progress: 40,
                  text: null,
                  segments: null,
                },
              }
            : {
                recording: {
                  recordingId: 'rec_123',
                  status: 'ready',
                  downloadUrl: 'https://cdn.example.com/rec_123.mp4',
                },
                transcript: {
                  status: 'ready',
                  progress: null,
                  text: 'Final transcript from backend.',
                  segments: [
                    {
                      id: null,
                      startMs: 0,
                      endMs: 1250,
                      text: 'hello',
                    },
                  ],
                },
              };
      }

      await fulfillJson(route, body);
      return;
    }

    if (
      pathname.endsWith(`/tasks/${taskId}/handoff`) &&
      request.method().toUpperCase() === 'DELETE'
    ) {
      deleted = true;
      await fulfillJson(route, {
        deleted: true,
        deletedAt: '2026-03-16T10:10:00.000Z',
        status: 'deleted',
      });
      return;
    }

    await fulfillJson(
      route,
      { message: `Unhandled handoff route ${pathname}` },
      404,
    );
  });

  await page.route('https://storage.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  await page.route('https://cdn.example.com/**', async (route) => {
    await route.fulfill({ status: 200, body: '' });
  });

  return state;
}
