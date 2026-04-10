import {
  mockTalentPartnerRequest,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi resendInvite', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('returns null when identifiers are missing', async () => {
    const { resendInvite } = await import('@/features/talent-partner/api');
    await expect(resendInvite('', NaN)).resolves.toBeNull();
  });

  it('posts resend endpoint when identifiers are valid', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: { ok: true },
      requestId: null,
    });
    const { resendInvite } = await import('@/features/talent-partner/api');
    await resendInvite('sim_9', 42);
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials/sim_9/candidates/42/invite/resend',
      { method: 'POST' },
    );
  });
});
