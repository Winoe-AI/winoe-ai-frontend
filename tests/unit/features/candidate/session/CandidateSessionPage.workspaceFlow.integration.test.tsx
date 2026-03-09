import { act, render, screen, waitFor } from '@testing-library/react';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';
import type { CandidateTask } from '@/features/candidate/session/CandidateSessionProvider';

const useCandidateSessionMock = jest.fn();
const useCandidateSessionActionsMock = jest.fn();
const getCandidateWorkspaceStatusMock = jest.fn();
const initCandidateWorkspaceMock = jest.fn();

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

jest.mock('@/features/candidate/api', () => {
  const actual = jest.requireActual('@/features/candidate/api');
  return {
    ...actual,
    getCandidateWorkspaceStatus: (...args: unknown[]) =>
      getCandidateWorkspaceStatusMock(...args),
    initCandidateWorkspace: (...args: unknown[]) =>
      initCandidateWorkspaceMock(...args),
  };
});

const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

function buildTask(overrides: Partial<CandidateTask>): CandidateTask {
  return {
    id: 2,
    dayIndex: 2,
    type: 'code',
    title: 'Day 2 Coding',
    description: 'Implement the feature',
    ...overrides,
  };
}

function buildSessionState(task: CandidateTask) {
  return {
    inviteToken: 'inv',
    candidateSessionId: 99,
    bootstrap: {
      candidateSessionId: 99,
      status: 'in_progress' as const,
      simulation: { title: 'Simulation', role: 'Engineer' },
    },
    started: true,
    taskState: {
      loading: false,
      error: null,
      isComplete: false,
      completedTaskIds: [1],
      currentTask: task,
    },
    authStatus: 'ready' as const,
    authError: null,
  };
}

function buildSessionContext(state: ReturnType<typeof buildSessionState>) {
  return {
    state,
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

describe('CandidateSessionPage shared coding workspace flow', () => {
  beforeEach(() => {
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
  });

  it('preserves shared repo/codespace identity when switching Day 2 to Day 3', async () => {
    const day2Task = buildTask({
      id: 200,
      dayIndex: 2,
      type: 'code',
      title: 'Day 2',
    });
    const day3Task = buildTask({
      id: 300,
      dayIndex: 3,
      type: 'debug',
      title: 'Day 3',
      description: 'Debug and wrap-up',
    });

    getCandidateWorkspaceStatusMock.mockImplementation(
      ({ taskId }: { taskId: number }) => {
        if (taskId === day2Task.id) {
          return Promise.resolve({
            repoFullName: 'acme/unified-workspace',
            repoName: 'acme/unified-workspace',
            repoUrl: 'https://github.com/acme/unified-workspace',
            codespaceUrl: 'https://codespaces.new/acme/unified-workspace',
          });
        }
        if (taskId === day3Task.id) {
          return Promise.resolve({
            repoFullName: 'acme/unified-workspace',
            repoName: 'acme/unified-workspace',
            repoUrl: 'https://github.com/acme/unified-workspace',
            codespaceUrl: null,
          });
        }
        return Promise.resolve(null);
      },
    );

    const sessionContext = buildSessionContext(buildSessionState(day2Task));
    useCandidateSessionMock.mockImplementation(() => sessionContext);

    const { rerender } = render(<CandidateSessionPage token="inv" />);

    expect(
      await screen.findByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo URL/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/unified-workspace',
    );
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');

    await act(async () => {
      sessionContext.state = {
        ...sessionContext.state,
        taskState: {
          ...sessionContext.state.taskState,
          currentTask: day3Task,
        },
      };
      rerender(<CandidateSessionPage token="inv" />);
    });

    await waitFor(() =>
      expect(getCandidateWorkspaceStatusMock).toHaveBeenCalledWith({
        taskId: 300,
        candidateSessionId: 99,
      }),
    );

    expect(
      screen.getByText(/Repo: acme\/unified-workspace/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Repo URL/i })).toHaveAttribute(
      'href',
      'https://github.com/acme/unified-workspace',
    );
    expect(
      screen.getByRole('link', { name: /Open Codespace/i }),
    ).toHaveAttribute('href', 'https://codespaces.new/acme/unified-workspace');
  });

  it('fails closed through the lifted flow when Day 2 and Day 3 snapshots conflict', async () => {
    const day2Task = buildTask({
      id: 210,
      dayIndex: 2,
      type: 'code',
      title: 'Day 2',
    });
    const day3Task = buildTask({
      id: 310,
      dayIndex: 3,
      type: 'debug',
      title: 'Day 3',
      description: 'Debug and wrap-up',
    });

    getCandidateWorkspaceStatusMock.mockImplementation(
      ({ taskId }: { taskId: number }) => {
        if (taskId === day2Task.id) {
          return Promise.resolve({
            repoFullName: 'acme/day2',
            repoName: 'acme/day2',
            repoUrl: 'https://github.com/acme/day2',
            codespaceUrl: 'https://codespaces.new/acme/day2',
          });
        }
        if (taskId === day3Task.id) {
          return Promise.resolve({
            repoFullName: 'acme/day3',
            repoName: 'acme/day3',
            repoUrl: 'https://github.com/acme/day3',
            codespaceUrl: 'https://codespaces.new/acme/day3',
          });
        }
        return Promise.resolve(null);
      },
    );

    const sessionContext = buildSessionContext(buildSessionState(day2Task));
    useCandidateSessionMock.mockImplementation(() => sessionContext);

    const { rerender } = render(<CandidateSessionPage token="inv" />);
    await screen.findByRole('link', { name: /Repo URL/i });

    await act(async () => {
      sessionContext.state = {
        ...sessionContext.state,
        taskState: {
          ...sessionContext.state.taskState,
          currentTask: day3Task,
        },
      };
      rerender(<CandidateSessionPage token="inv" />);
    });

    await waitFor(() =>
      expect(
        screen.getByText(
          /Workspace mismatch detected between Day 2 and Day 3/i,
        ),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole('link', { name: /Repo URL/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /Open Codespace/i })).toBeNull();
  });
});
