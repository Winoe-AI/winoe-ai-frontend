import { createInviteInit } from '@/features/candidate/session/hooks/useInviteInitRunner';
import { INVITE_ALREADY_CLAIMED_MESSAGE } from '@/platform/copy/invite';

const resolveCandidateInviteTokenMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
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

  it('routes 403 invite errors to access denied guidance', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 403,
      message: 'Forbidden',
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setErrorStatus).toHaveBeenCalledWith(403);
    expect(params.setView).toHaveBeenCalledWith('accessDenied');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'You do not have access to this invite.',
    );
    expect(params.redirectToLogin).not.toHaveBeenCalled();
  });

  it('falls back to sign-in guidance for a bare 409 without recovery payload', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 409 });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setErrorStatus).toHaveBeenCalledWith(409);
    expect(params.setView).toHaveBeenCalledWith('auth');
    expect(params.setAuthMessage).toHaveBeenCalledWith(
      INVITE_ALREADY_CLAIMED_MESSAGE,
    );
    expect(params.redirectToLogin).not.toHaveBeenCalled();
  });

  it('treats a recovered invite payload as the normal running flow', async () => {
    resolveCandidateInviteTokenMock.mockResolvedValue({
      candidateSessionId: 101,
      status: 'in_progress',
      trial: { title: 'Recovered Trial', role: 'Candidate' },
      aiNoticeText: 'Notice',
      aiNoticeVersion: 'v1',
      evalEnabledByDay: {},
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateSessionId: 101,
        trial: { title: 'Recovered Trial', role: 'Candidate' },
      }),
    );
    expect(params.setView).toHaveBeenCalledWith('running');
    expect(params.markEnd).toHaveBeenCalledWith('candidate:init', {
      status: 'success',
    });
  });
});
