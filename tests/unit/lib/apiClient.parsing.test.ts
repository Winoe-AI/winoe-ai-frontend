import {
  apiClient,
  fetchMock,
  resetApiClientMocks,
  responseHelpers,
  safeRequest,
} from './apiClient.testlib';

describe('apiClient parsing and safeRequest', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  it('returns undefined for 204 and malformed payload reads', async () => {
    fetchMock.mockResolvedValueOnce(
      responseHelpers.textResponse('', 204, { 'content-type': '' }),
    );
    expect(await apiClient.delete('/noop')).toBeUndefined();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('bad json');
      },
      text: async () => {
        throw new Error('no text');
      },
    } as unknown as Response);
    expect(await apiClient.get('/bad-json')).toBeUndefined();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      json: async () => {
        throw new Error('not json');
      },
      text: async () => {
        throw new Error('text read failed');
      },
    } as unknown as Response);
    expect(await apiClient.get('/text-fail')).toBeUndefined();
  });

  it('supports delete with explicit basePath and headers', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({}, 200));
    await apiClient.delete(
      '/custom-delete',
      { headers: { 'X-Del': '1' } },
      { basePath: 'https://api.dev' },
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dev/custom-delete',
      expect.objectContaining({
        method: 'DELETE',
        headers: { 'X-Del': '1' },
        credentials: 'omit',
      }),
    );
  });

  it('safeRequest returns data on success and wraps unknown errors', async () => {
    fetchMock
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ ok: true, value: 1 }),
      )
      .mockRejectedValueOnce('bad');
    const success = await safeRequest<{ value: number }>('/path');
    expect(success).toMatchObject({ data: { value: 1 }, error: null });

    const failure = await safeRequest('/oops');
    expect(failure.data).toBeNull();
    expect(failure.error).toBeInstanceOf(Error);
    expect(failure.error?.message).toBe('bad');
  });
});
