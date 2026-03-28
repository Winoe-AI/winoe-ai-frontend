import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - perf fallback and URL normalization', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('falls back to Date.now when performance is unavailable', async () => {
    const originalPerformance = global.performance;
    // @ts-expect-error testing fallback
    delete global.performance;
    jest.resetModules();
    process.env.NEXT_PUBLIC_TENON_DEBUG_PERF = '1';
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { apiClient: freshClient, __resetHttpClientCache: freshReset } =
      await import('@/platform/api-client/client');
    freshReset();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
      ) as unknown as typeof fetch;
    await freshClient.get('/perf-fallback', { skipCache: true });
    expect(infoSpy).toHaveBeenCalled();
    infoSpy.mockRestore();
    global.performance = originalPerformance;
    jest.resetModules();
  });

  it('handles URL with hash', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
    );
    await apiClient.get('/path#anchor', { cacheTtlMs: 5000 });
    expect(global.fetch).toHaveBeenCalled();
  });

  it('handles invalid URL for cache key gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
    );
    await apiClient.get('/path with spaces', { skipCache: true });
    expect(global.fetch).toHaveBeenCalled();
  });
});
