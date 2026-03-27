import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - cache and dedupe', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('skips cache when skipCache is true', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ call: 1 }) as unknown as Response)
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ call: 2 }) as unknown as Response);
    await apiClient.get('/skip-cache', { cacheTtlMs: 10000 });
    const result = await apiClient.get('/skip-cache', { skipCache: true });
    expect(result).toEqual({ call: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('disables dedupe when disableDedupe is true', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(responseHelpers.jsonResponse({ ok: true }) as unknown as Response), 10)),
    );
    await Promise.all([
      apiClient.get('/no-dedupe', { disableDedupe: true }),
      apiClient.get('/no-dedupe', { disableDedupe: true }),
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('dedupes concurrent requests by default', async () => {
    let resolveCount = 0;
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(responseHelpers.jsonResponse({ count: ++resolveCount }) as unknown as Response), 10)),
    );
    const [a, b] = await Promise.all([
      apiClient.get('/dedupe-default', { cacheTtlMs: 5000 }),
      apiClient.get('/dedupe-default', { cacheTtlMs: 5000 }),
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('evicts oldest cache entry when limit exceeded', async () => {
    for (let i = 0; i < 160; i++) {
      (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ i }) as unknown as Response);
      await apiClient.get(`/cache-evict-${i}`, { cacheTtlMs: 60000 });
    }
    expect(global.fetch).toHaveBeenCalledTimes(160);
  });
});
