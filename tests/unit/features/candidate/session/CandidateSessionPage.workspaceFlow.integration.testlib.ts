import type { CandidateTask } from '@/features/candidate/session/CandidateSessionProvider';

export const useCandidateSessionMock = jest.fn();
export const useCandidateSessionActionsMock = jest.fn();
export const getCandidateWorkspaceStatusMock = jest.fn();
export const initCandidateWorkspaceMock = jest.fn();
export const routerMock = { push: jest.fn(), replace: jest.fn() };

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: () => useCandidateSessionMock(),
}));
jest.mock(
  '@/features/candidate/session/hooks/useCandidateSessionActions',
  () => ({
    useCandidateSessionActions: (...args: unknown[]) =>
      useCandidateSessionActionsMock(...args),
  }),
);
jest.mock('@/features/candidate/session/api', () => {
  const actual = jest.requireActual('@/features/candidate/session/api');
  return {
    ...actual,
    getCandidateWorkspaceStatus: (...args: unknown[]) =>
      getCandidateWorkspaceStatusMock(...args),
    initCandidateWorkspace: (...args: unknown[]) =>
      initCandidateWorkspaceMock(...args),
  };
});
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

export function buildTask(overrides: Partial<CandidateTask>): CandidateTask {
  return {
    id: 2,
    dayIndex: 2,
    type: 'code',
    title: 'Day 2 Coding',
    description: 'Implement the feature',
    ...overrides,
  };
}

export function buildSessionContext(task: CandidateTask) {
  return {
    state: {
      inviteToken: 'inv',
      candidateSessionId: 99,
      bootstrap: {
        candidateSessionId: 99,
        status: 'in_progress' as const,
        trial: { title: 'Trial', role: 'Engineer' },
      },
      started: true,
      taskState: {
        loading: false,
        error: null,
        isComplete: false,
        completedAt: null,
        completedTaskIds: [1],
        currentTask: task,
      },
      authStatus: 'ready' as const,
      authError: null,
    },
    setInviteToken: jest.fn(),
    setCandidateSessionId: jest.fn(),
    setBootstrap: jest.fn(),
    setStarted: jest.fn(),
    setTaskLoading: jest.fn(),
    setTaskLoaded: jest.fn(),
    setTaskError: jest.fn(),
    clearTaskError: jest.fn(),
    reset: jest.fn(),
  };
}

export function resetWorkspaceFlowMocks() {
  jest.clearAllMocks();
  useCandidateSessionActionsMock.mockReturnValue({
    fetchCurrentTask: jest.fn().mockResolvedValue(undefined),
    handleSubmit: jest.fn().mockResolvedValue(undefined),
    handleStartTests: jest.fn().mockResolvedValue({ runId: 'run-1' }),
    handlePollTests: jest.fn().mockResolvedValue({
      status: 'running',
      passed: null,
      failed: null,
      total: null,
      stdout: null,
      stderr: null,
      workflowUrl: null,
      commitSha: null,
    }),
    runInit: jest.fn(),
    submitting: false,
  });
  initCandidateWorkspaceMock.mockResolvedValue(null);
}
