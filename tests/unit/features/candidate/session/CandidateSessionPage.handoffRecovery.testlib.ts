import type { CandidateTask } from '@/features/candidate/session/CandidateSessionProvider';

export const useCandidateSessionMock = jest.fn();
export const useCandidateSessionActionsMock = jest.fn();
export const getHandoffStatusMock = jest.fn();
export const routerMock = { push: jest.fn(), replace: jest.fn() };

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: () => useCandidateSessionMock(),
}));
jest.mock('@/features/candidate/session/hooks/useCandidateSessionActions', () => ({
  useCandidateSessionActions: (...args: unknown[]) => useCandidateSessionActionsMock(...args),
}));
jest.mock('@/features/candidate/session/task/handoff/handoffApi', () => ({
  getHandoffStatus: (...args: unknown[]) => getHandoffStatusMock(...args),
  initHandoffUpload: jest.fn(),
  uploadFileToSignedUrl: jest.fn(),
  completeHandoffUpload: jest.fn(),
}));
jest.mock('next/navigation', () => ({ useRouter: () => routerMock }));

const makeIso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();
const makeDay4HandoffTask = (): CandidateTask => ({
  id: 44,
  dayIndex: 4,
  type: 'handoff',
  title: 'Day 4 handoff',
  description: 'Upload your demo handoff video.',
});

export const makeStatusReady = () => ({
  recordingId: 'rec_44',
  recordingStatus: 'ready',
  recordingDownloadUrl: 'https://cdn.example.com/rec_44.mp4',
  transcriptStatus: 'ready',
  transcriptProgressPct: null,
  transcriptText: 'Recovered transcript body',
  transcriptSegments: [{ id: null, startMs: 1000, endMs: 3000, text: 'Recovered segment line' }],
});

export function buildSessionContext(day4StartOffsetMs: number, day4EndOffsetMs: number) {
  return {
    state: {
      inviteToken: 'inv',
      candidateSessionId: 99,
      bootstrap: {
        candidateSessionId: 99,
        status: 'in_progress' as const,
        simulation: { title: 'Simulation', role: 'Engineer' },
        dayWindows: [
          { dayIndex: 4, windowStartAt: makeIso(day4StartOffsetMs), windowEndAt: makeIso(day4EndOffsetMs) },
          { dayIndex: 5, windowStartAt: makeIso(120 * 60 * 1000), windowEndAt: makeIso(180 * 60 * 1000) },
        ],
        currentDayWindow: {
          dayIndex: 4,
          windowStartAt: makeIso(day4StartOffsetMs),
          windowEndAt: makeIso(day4EndOffsetMs),
          state: day4EndOffsetMs > 0 ? ('open' as const) : ('closed' as const),
        },
      },
      started: true,
      taskState: { loading: false, error: null, isComplete: false, completedTaskIds: [11, 22, 33], currentTask: makeDay4HandoffTask() },
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

export function resetHandoffRecoveryMocks() {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  useCandidateSessionActionsMock.mockReturnValue({
    fetchCurrentTask: jest.fn().mockResolvedValue(undefined),
    handleSubmit: jest.fn().mockResolvedValue(undefined),
    handleStartTests: jest.fn().mockResolvedValue({ runId: 'run-1' }),
    handlePollTests: jest.fn().mockResolvedValue({ status: 'running', passed: null, failed: null, total: null, stdout: null, stderr: null, workflowUrl: null, commitSha: null }),
    runInit: jest.fn(),
    loginHref: '/auth/login?mode=candidate',
    inviteErrorCopy: 'Invite unavailable.',
    submitting: false,
  });
  getHandoffStatusMock.mockImplementation((params: { taskId: number; candidateSessionId: number }) =>
    params.taskId === 44 && params.candidateSessionId === 99 ? Promise.resolve(makeStatusReady()) : Promise.reject({ status: 404 }),
  );
}
