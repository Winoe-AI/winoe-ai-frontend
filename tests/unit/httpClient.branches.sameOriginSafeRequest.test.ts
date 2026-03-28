import {
  isSameOriginRequest,
  responseHelpers,
  safeRequest,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - isSameOriginRequest and safeRequest', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('checks same-origin path handling', () => {
    expect(isSameOriginRequest('/api/test')).toBe(true);
    expect(isSameOriginRequest('//example.com/api')).toBe(false);
    expect(isSameOriginRequest('https://other.com/api')).toBe(false);
  });

  it('returns data on safeRequest success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      responseHelpers.jsonResponse({ id: 1 }) as unknown as Response,
    );
    const result = await safeRequest('/test', { skipCache: true });
    expect(result.data).toEqual({ id: 1 });
    expect(result.error).toBeNull();
  });

  it('returns error on safeRequest failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error'),
    );
    const result = await safeRequest('/test', { skipCache: true });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Network error');
  });

  it('wraps non-error throws in safeRequest', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('string error');
    const result = await safeRequest('/test', { skipCache: true });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('string error');
  });

  it('handles unknown error types in safeRequest', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce({ weird: 'object' });
    const result = await safeRequest('/test', { skipCache: true });
    expect(result.data).toBeNull();
    expect(result.error?.message).toBe('Request failed');
  });
});
