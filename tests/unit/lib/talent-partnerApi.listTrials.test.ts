import {
  listTrials,
  mockTalentPartnerRequest,
  mockSafeRequest,
  resetTalentPartnerApiMocks,
  restoreTalentPartnerApiEnv,
} from './talent-partnerApi.testlib';

describe('talentPartnerApi listTrials', () => {
  beforeEach(() => {
    resetTalentPartnerApiMocks();
  });

  afterEach(() => {
    restoreTalentPartnerApiEnv();
  });

  it('calls GET /trials via requestTalentPartnerBff', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: [],
      requestId: null,
    });
    await listTrials();
    expect(mockTalentPartnerRequest).toHaveBeenCalledWith(
      '/trials',
      expect.objectContaining({ cache: undefined }),
    );
  });

  it('returns empty list for non-array payload and normalizes fields', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: {},
      requestId: null,
    });
    expect(await listTrials()).toEqual([]);
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: [
        {
          id: 'trial_2',
          title: 'Trial Two',
          role: 'Backend Engineer',
          created_at: '2025-12-11T10:00:00Z',
          candidate_count: 1,
          status: 'active_inviting',
        },
      ],
      requestId: null,
    });
    const result = await listTrials();
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'trial_2',
        candidateCount: 1,
        status: 'active_inviting',
      }),
    );
  });

  it('normalizes candidateCount from mixed numeric variants', async () => {
    mockTalentPartnerRequest.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          trial_title: 'A',
          role_name: 'R',
          created_at: '2025-01-01',
          numCandidates: 7,
        },
        {
          id: 2,
          trial_title: 'B',
          role_name: 'R',
          created_at: '2025-01-02',
          num_candidates: 8,
        },
      ],
      requestId: null,
    });
    const result = await listTrials();
    expect(result[0]?.candidateCount).toBe(7);
    expect(result[1]?.candidateCount).toBe(8);
  });

  it('calls listTrialsSafe with BFF base and skipAuth', async () => {
    mockSafeRequest.mockResolvedValueOnce({ data: [], error: null });
    const { listTrialsSafe } = await import('@/features/talent-partner/api');
    await listTrialsSafe();
    expect(mockSafeRequest).toHaveBeenCalledWith('/trials', undefined, {
      basePath: '/api',
      skipAuth: true,
    });
  });
});
