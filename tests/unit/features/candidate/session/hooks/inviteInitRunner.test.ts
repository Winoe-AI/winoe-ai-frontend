import { createInviteInit } from '@/features/candidate/session/hooks/useInviteInitRunner';
import { INVITE_ALREADY_CLAIMED_MESSAGE } from '@/platform/copy/invite';

const resolveCandidateInviteTokenMock = jest.fn();

jest.mock('@/features/candidate/session/api', () => ({
  resolveCandidateInviteToken: (...args: unknown[]) =>
    resolveCandidateInviteTokenMock(...args),
}));

function buildParams() {
  return {
    authStatus: 'ready' as const,
    setCandidateSessionId: jest.fn(),
    setBootstrap: jest.fn(),
    clearTaskError: jest.fn(),
    setView: jest.fn(),
    setAuthMessage: jest.fn(),
    setErrorMessage: jest.fn(),
    setErrorStatus: jest.fn(),
    setInviteErrorState: jest.fn(),
    setInviteContactName: jest.fn(),
    setInviteContactEmail: jest.fn(),
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

  it('redirects to login for generic auth-required 401 bootstrap failures', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 401 });
    const params = buildParams();
    params.authStatus = 'unauthenticated';
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.redirectToLogin).toHaveBeenCalledTimes(1);
    expect(params.setInviteErrorState).toHaveBeenCalledTimes(1);
    expect(params.setInviteErrorState).toHaveBeenCalledWith(null);
    expect(params.setInviteContactName).toHaveBeenCalledTimes(1);
    expect(params.setInviteContactName).toHaveBeenCalledWith(null);
    expect(params.setInviteContactEmail).toHaveBeenCalledTimes(1);
    expect(params.setInviteContactEmail).toHaveBeenCalledWith(null);
    expect(params.setView).not.toHaveBeenCalledWith('accessDenied');
    expect(params.markEnd).toHaveBeenCalledWith('candidate:init', {
      status: 'auth_redirect',
    });
  });

  it('renders invalid invite guidance for invite-specific 401 failures', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 401,
      details: { code: 'INVITE_INVALID' },
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.redirectToLogin).not.toHaveBeenCalled();
    expect(params.setInviteErrorState).toHaveBeenCalledWith('invalid');
    expect(params.setErrorStatus).toHaveBeenCalledWith(401);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'This invite link is invalid. Please open the latest invite email or contact Winoe AI support for help.',
    );
    expect(params.markEnd).toHaveBeenCalledWith('candidate:init', {
      status: 'error',
      inviteErrorState: 'invalid',
    });
  });

  it('treats a missing token as an invalid invite', async () => {
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('');

    expect(params.setInviteErrorState).toHaveBeenCalledWith('invalid');
    expect(params.setErrorStatus).toHaveBeenCalledWith(400);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'This invite link is invalid. Please open the latest invite email or contact Winoe AI support for help.',
    );
  });

  it('sets accessDenied flow for 403 bootstrap failures', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 403 });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.redirectToLogin).not.toHaveBeenCalled();
    expect(params.setInviteErrorState).toHaveBeenCalledTimes(1);
    expect(params.setInviteErrorState).toHaveBeenCalledWith(null);
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

  it('routes invalid invite states to the invite error view', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 422,
      details: { code: 'INVITE_INVALID' },
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setInviteErrorState).toHaveBeenCalledWith('invalid');
    expect(params.setErrorStatus).toHaveBeenCalledWith(422);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'This invite link is invalid. Please open the latest invite email or contact Winoe AI support for help.',
    );
  });

  it('routes malformed token validation errors to the invite error view', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 422,
      details: {
        code: 'VALIDATION_ERROR',
        detail: [
          {
            type: 'string_too_short',
            loc: ['path', 'token'],
            msg: 'String should have at least 1 character',
            input: 'not-a-real-token',
          },
        ],
      },
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setInviteErrorState).toHaveBeenCalledWith('invalid');
    expect(params.setErrorStatus).toHaveBeenCalledWith(422);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'This invite link is invalid. Please open the latest invite email or contact Winoe AI support for help.',
    );
  });

  it('routes expired invite states to the expired view', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 422,
      details: { code: 'INVITE_EXPIRED' },
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setInviteErrorState).toHaveBeenCalledWith('expired');
    expect(params.setErrorStatus).toHaveBeenCalledWith(422);
    expect(params.setView).toHaveBeenCalledWith('expired');
  });

  it('routes terminated Trial invite states to the invite error view', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({
      status: 410,
      details: { trialStatus: 'terminated' },
    });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setInviteErrorState).toHaveBeenCalledWith('terminated');
    expect(params.setErrorStatus).toHaveBeenCalledWith(410);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      'This Trial is no longer available.',
    );
  });

  it('falls back to sign-in guidance for a bare 409 without recovery payload', async () => {
    resolveCandidateInviteTokenMock.mockRejectedValue({ status: 409 });
    const params = buildParams();
    const runInit = createInviteInit(params);

    await runInit('invite-token');

    expect(params.setErrorStatus).toHaveBeenCalledWith(409);
    expect(params.setErrorMessage).toHaveBeenCalledWith(
      INVITE_ALREADY_CLAIMED_MESSAGE,
    );
    expect(params.setAuthMessage).toHaveBeenCalledWith(null);
    expect(params.setView).toHaveBeenCalledWith('error');
    expect(params.setInviteErrorState).toHaveBeenCalledWith('already_claimed');
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
