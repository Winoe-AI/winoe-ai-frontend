import { useCandidateSession } from '@/features/candidate/session/CandidateSessionProvider';
import { useTaskSubmission } from '@/features/candidate/session/hooks/useTaskSubmission';
import { resolveCandidateInviteToken } from '@/features/candidate/session/api';

jest.mock('@/features/candidate/session/CandidateSessionProvider', () => ({
  useCandidateSession: jest.fn(),
}));

jest.mock('@/features/candidate/session/hooks/useTaskSubmission', () => ({
  useTaskSubmission: jest.fn(),
}));

jest.mock('@/features/candidate/session/api', () => ({
  ...jest.requireActual('@/features/candidate/session/api'),
  resolveCandidateInviteToken: jest.fn(),
  getCandidateCurrentTask: jest.fn(),
  pollCandidateTestRun: jest.fn(),
  startCandidateTestRun: jest.fn(),
}));

export const routerMock = {
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

export const mockUseCandidateSession = useCandidateSession as jest.Mock;
export const mockUseTaskSubmission = useTaskSubmission as jest.Mock;
export const mockResolveInvite = resolveCandidateInviteToken as jest.Mock;

export function resetCandidateSessionUnitMocks() {
  jest.resetAllMocks();
  mockUseTaskSubmission.mockReturnValue({
    submitting: false,
    handleSubmit: jest.fn(),
  });
}

export function buildSession(overrides?: {
  token?: string | null;
  authStatus?: 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';
  inviteToken?: string | null;
}) {
  const token = overrides && 'token' in overrides ? overrides.token : 'token';
  const inviteToken =
    overrides && 'inviteToken' in overrides ? overrides.inviteToken : null;

  return {
    state: {
      inviteToken,
      token,
      candidateSessionId: null,
      bootstrap: null,
      started: false,
      taskState: {
        loading: false,
        error: null,
        isComplete: false,
        completedAt: null,
        completedTaskIds: [],
        currentTask: null,
      },
      authStatus: overrides?.authStatus ?? 'ready',
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
  };
}
