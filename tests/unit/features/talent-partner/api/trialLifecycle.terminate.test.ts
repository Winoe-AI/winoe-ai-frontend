import { terminateTrial } from '@/features/talent-partner/api/trialLifecycleApi';

const mockRequestTalentPartnerBff = jest.fn();

jest.mock('@/features/talent-partner/api/requestTalentPartnerBffApi', () => ({
  requestTalentPartnerBff: (...args: unknown[]) =>
    mockRequestTalentPartnerBff(...args),
}));

describe('trialLifecycle terminateTrial', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('posts to terminate endpoint and returns cleanup IDs', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: {
        trialId: 42,
        status: 'terminated',
        cleanupJobIds: ['job-1', 'job-2'],
      },
    });

    const result = await terminateTrial('trial-1');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      trialId: '42',
      status: 'terminated',
      cleanupJobIds: ['job-1', 'job-2'],
    });
    expect(mockRequestTalentPartnerBff).toHaveBeenCalledWith(
      '/trials/trial-1/terminate',
      {
        method: 'POST',
        body: { confirm: true },
      },
    );
  });

  it('returns ok:false when status is missing from success payload', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: { trialId: 42, cleanupJobIds: ['job-1'] },
    });

    const result = await terminateTrial('trial-1');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Unable to terminate trial.');
    expect(result.data).toEqual({
      trialId: '42',
      status: 'unknown',
      cleanupJobIds: ['job-1'],
    });
  });

  it('treats idempotent conflict with terminated payload as success', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({
      status: 409,
      details: {
        trialId: 'trial-1',
        status: 'terminated',
        cleanupJobIds: ['cleanup-1'],
      },
    });

    const result = await terminateTrial('trial-1');
    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      trialId: 'trial-1',
      status: 'terminated',
      cleanupJobIds: ['cleanup-1'],
    });
  });

  it('returns ok:false for 409 payload without terminated status', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({
      status: 409,
      details: { trialId: 'trial-1', cleanupJobIds: ['cleanup-1'] },
    });

    const result = await terminateTrial('trial-1');
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.message).toBe('Unable to terminate trial.');
  });
});
