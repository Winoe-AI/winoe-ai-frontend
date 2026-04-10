export const useCandidateSessionMock = jest.fn();
export const resolveInviteMock = jest.fn();
export const getCurrentTaskMock = jest.fn();
export const buildLoginHrefMock = jest.fn(() => '/auth/login?mode=candidate');
export const routerMock = { push: jest.fn(), replace: jest.fn() };

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
  default: ({ task }: { task: { title: string } }) => (
    <div data-testid="task-view">{task.title}</div>
  ),
}));
jest.mock('@/features/candidate/tasks/components/WorkspacePanel', () => ({
  __esModule: true,
  WorkspacePanel: (props: Record<string, unknown>) => (
    <div data-testid="workspace-panel">{JSON.stringify(props)}</div>
  ),
}));
jest.mock('@/features/candidate/tasks/components/RunTestsPanel', () => ({
  __esModule: true,
  RunTestsPanel: (props: Record<string, unknown>) => (
    <div data-testid="run-tests-panel">{JSON.stringify(props)}</div>
  ),
}));
jest.mock('@/features/candidate/tasks/components/ResourcePanel', () => ({
  __esModule: true,
  ResourcePanel: ({ title }: { title: string }) => (
    <div data-testid={`resource-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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
jest.mock('@/features/candidate/session/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) =>
    resolveInviteMock(...args),
  getCandidateCurrentTask: (...args: unknown[]) => getCurrentTaskMock(...args),
  pollCandidateTestRun: jest.fn(),
  startCandidateTestRun: jest.fn(),
}));
jest.mock('@/features/auth/authPaths', () => ({
  buildLoginHref: () => buildLoginHrefMock(),
}));
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

export const baseState = () => ({
  state: {
    inviteToken: 'inv',
    token: 'auth-token',
    candidateSessionId: 99,
    bootstrap: {
      candidateSessionId: 99,
      status: 'in_progress' as const,
      trial: { title: 'Sim', role: 'Role' },
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
        type: 'code',
        title: 'Code Day',
        description: 'http://docs',
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

export const buildState = (
  overrides?: Partial<ReturnType<typeof baseState>>,
) => ({ ...baseState(), ...(overrides ?? {}) });
export const primeViewApiMocks = () => {
  resolveInviteMock.mockResolvedValue({
    candidateSessionId: 99,
    status: 'in_progress',
    trial: { title: 'Sim', role: 'Role' },
  });
  getCurrentTaskMock.mockResolvedValue({
    isComplete: false,
    completedTaskIds: [],
    currentTask: {
      id: 1,
      dayIndex: 2,
      type: 'code',
      title: 'Code Day',
      description: 'http://docs',
    },
  });
};
export const CandidateSessionPage = (
  jest.requireActual('@/features/candidate/session/CandidateSessionPage') as {
    default: (props: { token: string }) => unknown;
  }
).default;
