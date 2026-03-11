import { render, screen, waitFor } from '@testing-library/react';
import CandidateSessionPage from '@/features/candidate/session/CandidateSessionPage';
import type { CandidateTask } from '@/features/candidate/session/CandidateSessionProvider';

const useCandidateSessionMock = jest.fn();
const useCandidateSessionActionsMock = jest.fn();
const getHandoffStatusMock = jest.fn();

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

jest.mock('@/features/candidate/session/task/handoff/handoffApi', () => ({
  getHandoffStatus: (...args: unknown[]) => getHandoffStatusMock(...args),
  initHandoffUpload: jest.fn(),
  uploadFileToSignedUrl: jest.fn(),
  completeHandoffUpload: jest.fn(),
}));

const routerMock = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

function makeIso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function makeStatusReady() {
  return {
    recordingId: 'rec_44',
    recordingStatus: 'ready',
    recordingDownloadUrl: 'https://cdn.example.com/rec_44.mp4',
    transcriptStatus: 'ready',
    transcriptProgressPct: null,
    transcriptText: 'Recovered transcript body',
    transcriptSegments: [
      {
        id: null,
        startMs: 1000,
        endMs: 3000,
        text: 'Recovered segment line',
      },
    ],
  };
}

function makeDay4HandoffTask(): CandidateTask {
  return {
    id: 44,
    dayIndex: 4,
    type: 'handoff',
    title: 'Day 4 handoff',
    description: 'Upload your demo handoff video.',
  };
}

function buildSessionState(params: {
  day4StartOffsetMs: number;
  day4EndOffsetMs: number;
  day5StartOffsetMs: number;
  day5EndOffsetMs: number;
}) {
  return {
    inviteToken: 'inv',
    candidateSessionId: 99,
    bootstrap: {
      candidateSessionId: 99,
      status: 'in_progress' as const,
      simulation: { title: 'Simulation', role: 'Engineer' },
      dayWindows: [
        {
          dayIndex: 4,
          windowStartAt: makeIso(params.day4StartOffsetMs),
          windowEndAt: makeIso(params.day4EndOffsetMs),
        },
        {
          dayIndex: 5,
          windowStartAt: makeIso(params.day5StartOffsetMs),
          windowEndAt: makeIso(params.day5EndOffsetMs),
        },
      ],
      currentDayWindow: {
        dayIndex: 4,
        windowStartAt: makeIso(params.day4StartOffsetMs),
        windowEndAt: makeIso(params.day4EndOffsetMs),
        state:
          params.day4EndOffsetMs > 0 ? ('open' as const) : ('closed' as const),
      },
    },
    started: true,
    taskState: {
      loading: false,
      error: null,
      isComplete: false,
      completedTaskIds: [11, 22, 33],
      currentTask: makeDay4HandoffTask(),
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

describe('CandidateSessionPage Day 4 handoff current task', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    window.localStorage.clear();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();

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
      loginHref: '/auth/login?mode=candidate',
      inviteErrorCopy: 'Invite unavailable.',
      submitting: false,
    });

    getHandoffStatusMock.mockImplementation((params: unknown) => {
      const { taskId, candidateSessionId } = params as {
        taskId: number;
        candidateSessionId: number;
      };
      if (taskId === 44 && candidateSessionId === 99)
        return Promise.resolve(makeStatusReady());
      return Promise.reject({ status: 404 });
    });
  });

  it('renders Day 4 handoff panel from canonical current task with preview and transcript', async () => {
    useCandidateSessionMock.mockReturnValue(
      buildSessionContext(
        buildSessionState({
          day4StartOffsetMs: -30 * 60 * 1000,
          day4EndOffsetMs: 30 * 60 * 1000,
          day5StartOffsetMs: 120 * 60 * 1000,
          day5EndOffsetMs: 180 * 60 * 1000,
        }),
      ),
    );

    const { container } = render(<CandidateSessionPage token="inv" />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument(),
    );

    expect(getHandoffStatusMock).toHaveBeenCalledWith({
      taskId: 44,
      candidateSessionId: 99,
    });
    expect(screen.getAllByText(/day 4 handoff/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeEnabled();
    expect(screen.getByText(/recovered transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/00:01 - 00:03/i)).toBeInTheDocument();
    expect(screen.getByText(/recovered segment line/i)).toBeInTheDocument();

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video?.getAttribute('src')).toBe(
      'https://cdn.example.com/rec_44.mp4',
    );
  });

  it('disables replace after Day 4 cutoff while still rendering preview + transcript', async () => {
    useCandidateSessionMock.mockReturnValue(
      buildSessionContext(
        buildSessionState({
          day4StartOffsetMs: -180 * 60 * 1000,
          day4EndOffsetMs: -120 * 60 * 1000,
          day5StartOffsetMs: 120 * 60 * 1000,
          day5EndOffsetMs: 180 * 60 * 1000,
        }),
      ),
    );

    const { container } = render(<CandidateSessionPage token="inv" />);

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /replace upload/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole('button', { name: /replace upload/i }),
    ).toBeDisabled();
    expect(screen.getByText(/recovered transcript body/i)).toBeInTheDocument();
    expect(screen.getByText(/recovered segment line/i)).toBeInTheDocument();
    expect(container.querySelector('video')).toBeInTheDocument();
  });
});
