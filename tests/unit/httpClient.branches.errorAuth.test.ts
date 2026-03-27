import {
  apiClient,
  responseHelpers,
  setupHttpClientBranchTest,
  teardownHttpClientBranchTest,
  restoreHttpClientBranchTest,
} from './httpClient.branches.testlib';

describe('httpClient branches - error parsing and auth headers', () => {
  beforeEach(setupHttpClientBranchTest);
  afterEach(teardownHttpClientBranchTest);
  afterAll(restoreHttpClientBranchTest);

  it('handles error response json parse failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('invalid json');
      },
    } as unknown as Response);
    await expect(apiClient.get('/json-error-fail', { skipCache: true })).rejects.toMatchObject({
      message: 'Request failed with status 500',
    });
  });

  it('handles error response text parse failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => 'text/plain' },
      text: async () => {
        throw new Error('text read failed');
      },
    } as unknown as Response);
    await expect(apiClient.get('/text-error-fail', { skipCache: true })).rejects.toMatchObject({
      message: 'Request failed with status 500',
    });
  });

  it('does not attach auth header with authToken option', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/auth-test', { skipCache: true }, { authToken: 'custom-token' });
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('respects null authToken to skip auth', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/no-auth', { skipCache: true }, { authToken: null });
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('skips auth header when skipAuth is true', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }) as unknown as Response);
    await apiClient.get('/skip-auth', { skipCache: true }, { skipAuth: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBeUndefined();
  });
});
