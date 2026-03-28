export const useCandidateSessionMock = jest.fn();
export const startTestRunMock = jest.fn();
export const pollTestRunMock = jest.fn();
export const submitTaskMock = jest.fn();
export const resolveInviteMock = jest.fn();
export const getCurrentTaskMock = jest.fn();

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: () => useCandidateSessionMock(),
}));
jest.mock('@/features/candidate/tasks/CandidateTaskProgress', () => ({
  __esModule: true,
  default: ({ currentTaskTitle }: { currentTaskTitle: string | null }) => (
    <div data-testid="task-progress">{currentTaskTitle ?? 'no-title'}</div>
  ),
}));
jest.mock('@/features/candidate/tasks/CandidateTaskView', () => ({
  __esModule: true,
  default: ({
    task,
    onSubmit,
  }: {
    task: { title: string };
    onSubmit: (data: { response: string }) => void;
  }) => (
    <div data-testid="task-view">
      <span>{task.title}</span>
      <button
        data-testid="submit-btn"
        onClick={() => onSubmit({ response: 'test' })}
      >
        Submit
      </button>
    </div>
  ),
}));
jest.mock('@/features/candidate/tasks/components/WorkspacePanel', () => ({
  __esModule: true,
  WorkspacePanel: () => <div data-testid="workspace-panel" />,
}));
jest.mock('@/features/candidate/tasks/components/RunTestsPanel', () => ({
  __esModule: true,
  RunTestsPanel: ({
    onStart,
    onPoll,
  }: {
    onStart: () => Promise<{ runId: string }>;
    onPoll: (runId: string) => Promise<unknown>;
  }) => (
    <div data-testid="run-tests-panel">
      <button
        data-testid="run-tests-btn"
        onClick={() => void onStart().then(() => onPoll('test-run-id'))}
      >
        Run Tests
      </button>
    </div>
  ),
}));
jest.mock('@/features/candidate/tasks/components/ResourcePanel', () => ({
  __esModule: true,
  ResourcePanel: ({ title }: { title: string }) => (
    <div
      data-testid={`resource-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {title}
    </div>
  ),
}));
jest.mock('@/features/candidate/session/components/StateMessage', () => ({
  StateMessage: ({ title }: { title: string }) => (
    <div data-testid="state-message">{title}</div>
  ),
}));
jest.mock(
  '@/features/candidate/session/components/CandidateSessionSkeleton',
  () => ({
    CandidateSessionSkeleton: ({ message }: { message: string }) => (
      <div data-testid="skeleton">{message}</div>
    ),
  }),
);
jest.mock('@/features/candidate/session/api', () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number, message?: string) {
      super(message ?? `HTTP ${status}`);
      this.status = status;
      this.name = 'HttpError';
    }
  }
  return {
    resolveCandidateInviteToken: (...args: unknown[]) =>
      resolveInviteMock(...args),
    getCandidateCurrentTask: (...args: unknown[]) =>
      getCurrentTaskMock(...args),
    pollCandidateTestRun: (...args: unknown[]) => pollTestRunMock(...args),
    startCandidateTestRun: (...args: unknown[]) => startTestRunMock(...args),
    submitCandidateTask: (...args: unknown[]) => submitTaskMock(...args),
    HttpError,
  };
});
jest.mock('@/features/auth/authPaths', () => ({
  buildLoginHref: () => '/auth/login?mode=candidate',
}));

export const routerMock = { push: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

export const baseState = () => ({
  state: {
    inviteToken: 'inv',
    token: 'auth-token',
    candidateSessionId: 99,
    bootstrap: {
      candidateSessionId: 99,
      status: 'in_progress' as const,
      simulation: { title: 'Test Sim', role: 'Engineer' },
    },
    started: true,
    taskState: {
      loading: false,
      error: null,
      isComplete: false,
      completedTaskIds: [],
      currentTask: {
        id: 1,
        dayIndex: 2,
        type: 'code' as const,
        title: 'Code Task',
        description: 'Do the coding task',
      },
    },
    authStatus: 'ready' as const,
    authError: null,
  },
  setInviteToken: jest.fn(),
  setToken: jest.fn(),
  setCandidateSessionId: jest.fn(),
  setBootstrap: jest.fn(),
  setStarted: jest.fn(),
  setTaskLoading: jest.fn(),
  setTaskLoaded: jest.fn(),
  setTaskError: jest.fn(),
  clearTaskError: jest.fn(),
  reset: jest.fn(),
  loadAccessToken: jest.fn(),
});

export const primeHandlerApiMocks = () => {
  resolveInviteMock.mockResolvedValue({
    candidateSessionId: 99,
    status: 'in_progress',
    simulation: { title: 'Test Sim', role: 'Engineer' },
  });
  getCurrentTaskMock.mockResolvedValue({
    isComplete: false,
    completedTaskIds: [],
    currentTask: {
      id: 1,
      dayIndex: 2,
      type: 'code',
      title: 'Code Task',
      description: 'Do the coding task',
    },
  });
  startTestRunMock.mockResolvedValue({ runId: 'run-123' });
  pollTestRunMock.mockResolvedValue({
    status: 'passed',
    passed: 5,
    failed: 0,
    total: 5,
  });
  submitTaskMock.mockResolvedValue({ status: 'ok' });
};

export const withConsoleMuted = () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  return { errorSpy, debugSpy, infoSpy };
};

export const CandidateSessionPage = (
  jest.requireActual('@/features/candidate/session/CandidateSessionPage') as {
    default: (props: { token: string }) => unknown;
  }
).default;
