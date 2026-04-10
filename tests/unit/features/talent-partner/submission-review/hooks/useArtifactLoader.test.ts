import { loadArtifacts } from '@/features/talent-partner/submission-review/hooks/useArtifactLoader';

const fetchArtifactsWithLimitMock = jest.fn();

jest.mock(
  '@/features/talent-partner/submission-review/utils/candidateSubmissionsApiUtils',
  () => ({
    fetchArtifactsWithLimit: (...args: unknown[]) =>
      fetchArtifactsWithLimitMock(...args),
  }),
);

describe('useArtifactLoader.loadArtifacts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty artifacts for empty ids without fetching', async () => {
    const signal = new AbortController().signal;
    await expect(loadArtifacts([], signal)).resolves.toEqual({
      artifacts: {},
      hadError: false,
    });

    expect(fetchArtifactsWithLimitMock).not.toHaveBeenCalled();
  });

  it('passes through options and returns fetched artifacts', async () => {
    fetchArtifactsWithLimitMock.mockResolvedValue({
      results: { 11: { submissionId: 11 } },
      hadError: false,
    });

    const signal = new AbortController().signal;
    const result = await loadArtifacts([11], signal, {
      skipCache: true,
      cacheTtlMs: 5_000,
      concurrency: 2,
    });

    expect(fetchArtifactsWithLimitMock).toHaveBeenCalledWith([11], {
      signal,
      skipCache: true,
      cacheTtlMs: 5_000,
      concurrency: 2,
    });
    expect(result).toEqual({
      artifacts: { 11: { submissionId: 11 } },
      hadError: false,
    });
  });

  it('uses default cache ttl and propagates hadError=true', async () => {
    fetchArtifactsWithLimitMock.mockResolvedValue({
      results: { 10: { submissionId: 10 } },
      hadError: true,
    });

    const signal = new AbortController().signal;
    const result = await loadArtifacts([10], signal, { skipCache: false });

    expect(fetchArtifactsWithLimitMock).toHaveBeenCalledWith([10], {
      signal,
      skipCache: false,
      cacheTtlMs: 10000,
      concurrency: undefined,
    });
    expect(result.hadError).toBe(true);
    expect(result.artifacts[10]).toEqual({ submissionId: 10 });
  });
});
