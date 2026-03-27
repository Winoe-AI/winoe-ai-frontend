import {
  mockRecruiterRequest,
  resetRecruiterApiMocks,
  restoreRecruiterApiEnv,
} from './recruiterApi.testlib';

describe('recruiterApi resendInvite', () => {
  beforeEach(() => {
    resetRecruiterApiMocks();
  });

  afterEach(() => {
    restoreRecruiterApiEnv();
  });

  it('returns null when identifiers are missing', async () => {
    const { resendInvite } = await import('@/features/recruiter/api');
    await expect(resendInvite('', NaN)).resolves.toBeNull();
  });

  it('posts resend endpoint when identifiers are valid', async () => {
    mockRecruiterRequest.mockResolvedValueOnce({
      data: { ok: true },
      requestId: null,
    });
    const { resendInvite } = await import('@/features/recruiter/api');
    await resendInvite('sim_9', 42);
    expect(mockRecruiterRequest).toHaveBeenCalledWith(
      '/simulations/sim_9/candidates/42/invite/resend',
      { method: 'POST' },
    );
  });
});
