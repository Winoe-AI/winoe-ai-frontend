import { resolveCandidateInviteToken } from '@/features/candidate/session/api/invitesApi';

const apiGetMock = jest.fn();

jest.mock('@/platform/api-client/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}));

describe('resolveCandidateInviteToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reuses recoverable 409 session payloads as bootstrap data', async () => {
    const recoveredSession = {
      candidateSessionId: 88,
      status: 'in_progress',
      trial: { title: 'Recovered Trial', role: 'Candidate' },
      aiNoticeText: 'Notice',
      aiNoticeVersion: 'v1',
      evalEnabledByDay: {},
    };
    apiGetMock.mockRejectedValue({
      status: 409,
      details: { session: recoveredSession },
    });

    await expect(resolveCandidateInviteToken('invite-token')).resolves.toEqual(
      recoveredSession,
    );
  });
});
