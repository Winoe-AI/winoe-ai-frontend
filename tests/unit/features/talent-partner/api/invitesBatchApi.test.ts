/**
 * @jest-environment jsdom
 */
import { inviteCandidatesBatch } from '@/features/talent-partner/api/invitesBatchApi';

const mockRequestTalentPartnerBff = jest.fn();

jest.mock('@/features/talent-partner/api/requestTalentPartnerBffApi', () => ({
  requestTalentPartnerBff: (...args: unknown[]) =>
    mockRequestTalentPartnerBff(...args),
}));

describe('invitesBatchApi', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('posts to the BFF trials invite-candidates route', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: {
        invites: [
          {
            candidateSessionId: 9,
            name: 'A',
            email: 'a@example.com',
            inviteUrl: 'https://x/invite',
            status: 'sent',
          },
        ],
      },
    });

    const res = await inviteCandidatesBatch('trial-42', [
      { name: 'A', email: 'a@example.com' },
    ]);

    expect(mockRequestTalentPartnerBff).toHaveBeenCalledWith(
      '/trials/trial-42/invite-candidates',
      expect.objectContaining({
        method: 'POST',
        body: {
          candidates: [{ name: 'A', email: 'a@example.com' }],
        },
      }),
    );
    expect(res.invites[0]?.status).toBe('sent');
    expect(res.invites[0]?.candidateSessionId).toBe('9');
  });

  it('maps failed invite rows', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: {
        invites: [
          {
            candidateSessionId: null,
            name: 'B',
            email: 'b@example.com',
            inviteUrl: '',
            status: 'failed',
            errorCode: 'TRIAL_TERMINATED',
            errorMessage: 'Trial has been terminated.',
          },
        ],
      },
    });

    const res = await inviteCandidatesBatch('trial-1', [
      { name: 'B', email: 'b@example.com' },
    ]);

    expect(res.invites[0]?.status).toBe('failed');
    expect(res.invites[0]?.errorMessage).toBe('Trial has been terminated.');
  });
});
