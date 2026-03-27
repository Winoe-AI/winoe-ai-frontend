import {
  apiClient,
  __resetHttpClientCache,
  resetHttpClientExtraMocks,
  restoreHttpClientExtraEnv,
  responseHelpers,
} from './httpClient.extra.testlib';

describe('httpClient cache and perf logging edge cases', () => {
  beforeEach(() => {
    resetHttpClientExtraMocks();
  });

  afterEach(() => {
    restoreHttpClientExtraEnv();
  });

  it('logs perf data and sanitizes sensitive params when debug is on', async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_TENON_DEBUG_PERF = '1';
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { apiClient: debugApiClient } = await import('@/lib/api/client');
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);

    await debugApiClient.get(`/very-long-segment/${'a'.repeat(40)}?token=secret&code=${'b'.repeat(60)}`, { skipCache: true });
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toContain('[api][perf] GET');
    infoSpy.mockRestore();
    jest.resetModules();
  });

  it('normalizes URL for cache key and honors custom dedupeKey', async () => {
    __resetHttpClientCache();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ cached: true }) as unknown as Response)
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ user: 1 }) as unknown as Response)
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ user: 2 }) as unknown as Response);

    await apiClient.get('/cache-path?b=2&a=1', { cacheTtlMs: 5000 });
    await apiClient.get('/cache-path?a=1&b=2', { cacheTtlMs: 5000 });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [a, b] = await Promise.all([
      apiClient.get('/dedupe', { dedupeKey: 'user-1' }),
      apiClient.get('/dedupe', { dedupeKey: 'user-2' }),
    ]);
    expect(a).toEqual({ user: 1 });
    expect(b).toEqual({ user: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('sanitizes path with long segments in fallback debug mode', async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_TENON_DEBUG_PERF = 'true';
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    const { apiClient: debugApiClient } = await import('@/lib/api/client');
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);

    await debugApiClient.get(`/path/${'x'.repeat(40)}`, { skipCache: true });
    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0][0]).toContain('[id]');
    infoSpy.mockRestore();
    jest.resetModules();
  });
});
