import { createInviteInit } from '@/features/candidate/session/hooks/inviteInitRunner';

const resolveCandidateInviteTokenMock = jest.fn();

jest.mock('@/features/candidate/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) =>
    resolveCandidateInviteTokenMock(...args),
}));

function buildParams() {
  return {
    setCandidateSessionId: jest.fn(),
    setBootstrap: jest.fn(),
    clearTaskError: jest.fn(),
    setView: jest.fn(),
    setAuthMessage: jest.fn(),
    setErrorMessage: jest.fn(),
    setErrorStatus: jest.fn(),
    redirectToLogin: jest.fn(),
    fetchTask: jest.fn().mockResolvedValue(undefined),
    markStart: jest.fn(),
    markEnd: jest.fn(),
  };
}

describe('inviteInitRunner auth handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login for 401 bootstrap failures', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 401 });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.redirectToLogin).toHaveBeenCalledTimes(1);
    expect(params.setView).not.toHaveBeenCalledWith('accessDenied');
    expect(params.markEnd).toHaveBeenCalledWith('candidate:init', {
      status: 'auth_redirect',
    });
  });

  it('sets accessDenied flow for 403 bootstrap failures', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 403 });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.redirectToLogin).not.toHaveBeenCalled();
    expect(params.setErrorStatus).toHaveBeenCalledWith(403);
    expect(params.setView).toHaveBeenCalledWith('accessDenied');
    expect(params.markEnd).toHaveBeenCalledWith('candidate:init', {
      status: 'access_denied',
    });
  });
});
