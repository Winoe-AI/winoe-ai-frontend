import {
  listSimulations,
  mockRecruiterRequest,
  mockSafeRequest,
  resetRecruiterApiMocks,
  restoreRecruiterApiEnv,
} from './recruiterApi.testlib';

describe('recruiterApi listSimulations', () => {
  beforeEach(() => {
    resetRecruiterApiMocks();
  });

  afterEach(() => {
    restoreRecruiterApiEnv();
  });

  it('calls GET /simulations via requestRecruiterBff', async () => {
    mockRecruiterRequest.mockResolvedValueOnce({ data: [], requestId: null });
    await listSimulations();
    expect(mockRecruiterRequest).toHaveBeenCalledWith(
      '/simulations',
      expect.objectContaining({ cache: undefined }),
    );
  });

  it('returns empty list for non-array payload and normalizes fields', async () => {
    mockRecruiterRequest.mockResolvedValueOnce({ data: {}, requestId: null });
    expect(await listSimulations()).toEqual([]);
    mockRecruiterRequest.mockResolvedValueOnce({
      data: [
        {
          id: 'sim_2',
          title: 'Sim Two',
          role: 'Backend Engineer',
          created_at: '2025-12-11T10:00:00Z',
          candidate_count: 1,
          template_key: 'node-express-ts',
        },
      ],
      requestId: null,
    });
    const result = await listSimulations();
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'sim_2',
        candidateCount: 1,
        templateKey: 'node-express-ts',
      }),
    );
  });

  it('normalizes candidateCount from mixed numeric variants', async () => {
    mockRecruiterRequest.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          simulation_title: 'A',
          role_name: 'R',
          created_at: '2025-01-01',
          numCandidates: 7,
        },
        {
          id: 2,
          simulation_title: 'B',
          role_name: 'R',
          created_at: '2025-01-02',
          num_candidates: 8,
        },
      ],
      requestId: null,
    });
    const result = await listSimulations();
    expect(result[0]?.candidateCount).toBe(7);
    expect(result[1]?.candidateCount).toBe(8);
  });

  it('calls listSimulationsSafe with BFF base and skipAuth', async () => {
    mockSafeRequest.mockResolvedValueOnce({ data: [], error: null });
    const { listSimulationsSafe } = await import('@/features/recruiter/api');
    await listSimulationsSafe();
    expect(mockSafeRequest).toHaveBeenCalledWith('/simulations', undefined, {
      basePath: '/api',
      skipAuth: true,
    });
  });
});
