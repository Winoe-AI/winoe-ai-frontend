import {
  apiClient,
  __resetHttpClientCache,
} from '@/platform/api-client/client';
import { responseHelpers } from '../setup';

describe('httpClient cache/dedupe behavior', () => {
  const realFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset?.();
  });
  afterAll(() => {
    global.fetch = realFetch;
  });

  it('dedupes concurrent GETs and only fetches once', async () => {
    __resetHttpClientCache();
    const resolver: ((value: Response) => void)[] = [];
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise<Response>((resolve) => resolver.push(resolve)),
    );

    const p1 = apiClient.get('/dedupe-check');
    const p2 = apiClient.get('/dedupe-check');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    resolver[0](
      responseHelpers.jsonResponse({ ok: true }) as unknown as Response,
    );
    await expect(Promise.all([p1, p2])).resolves.toEqual([
      { ok: true },
      { ok: true },
    ]);
  });

  it('does not cache responses unless cacheTtlMs > 0', async () => {
    __resetHttpClientCache();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ value: 1 }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ value: 2 }) as unknown as Response,
      );

    const first = await apiClient.get('/no-cache');
    const second = await apiClient.get('/no-cache');
    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('uses TTL cache when cacheTtlMs is provided', async () => {
    __resetHttpClientCache();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ value: 1 }) as unknown as Response,
    );

    const first = await apiClient.get('/ttl-cache', { cacheTtlMs: 500 });
    const second = await apiClient.get('/ttl-cache', { cacheTtlMs: 500 });
    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 1 });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips dedupe when disableDedupe is true', async () => {
    __resetHttpClientCache();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ value: 1 }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ value: 2 }) as unknown as Response,
      );

    const [a, b] = await Promise.all([
      apiClient.get('/dedupe-off', { disableDedupe: true }),
      apiClient.get('/dedupe-off', { disableDedupe: true }),
    ]);

    expect(a).toEqual({ value: 1 });
    expect(b).toEqual({ value: 2 });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
