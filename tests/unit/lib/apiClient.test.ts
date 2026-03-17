import { apiClient, login, safeRequest } from '@/lib/api/client';
import { responseHelpers } from '../../setup';

const fetchMock = jest.fn();

describe('apiClient request helpers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('does not attach browser auth token headers and normalizes URLs', async () => {
    fetchMock.mockResolvedValue(
      responseHelpers.jsonResponse({ ok: true, data: { message: 'hi' } }),
    );

    await apiClient.get('/jobs');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/jobs',
      expect.objectContaining({
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    );
  });

  it('normalizes /backend paths when basePath is /api', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.get(
      '/backend/jobs',
      { skipCache: true },
      { basePath: '/api' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/jobs',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
      }),
    );
  });

  it('avoids double prefix when path already includes /api', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.get(
      '/api/backend/jobs',
      { skipCache: true },
      { basePath: '/api' },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/jobs',
      expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
      }),
    );
  });

  it('respects skipAuth and custom basePath', async () => {
    fetchMock.mockResolvedValue(
      responseHelpers.jsonResponse({ created: true, id: 7 }),
    );

    await apiClient.post(
      'tasks',
      { title: 'New' },
      { basePath: 'https://api.example.com', skipAuth: true },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New' }),
        credentials: 'omit',
      }),
    );
  });

  it('does not stringify FormData bodies', async () => {
    const fd = new FormData();
    fd.append('file', 'content');
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.post('/upload', fd);

    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.body).toBe(fd);
    expect(opts.headers).not.toHaveProperty('Content-Type');
  });

  it('extracts error messages from API errors', async () => {
    fetchMock.mockResolvedValue(
      responseHelpers.jsonResponse(
        { detail: [{ msg: 'Invalid password' }] },
        422,
      ),
    );

    await expect(
      login({ email: 'a@b.com', password: 'x' }),
    ).rejects.toMatchObject({
      message: 'Invalid password',
      status: 422,
    });
  });

  it('falls back to status-based messages for text errors', async () => {
    fetchMock.mockResolvedValue(
      responseHelpers.textResponse('Internal error', 500, {
        'content-type': 'text/plain',
      }),
    );

    await expect(apiClient.get('/oops')).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });

  it('rejects absolute cross-origin BFF URLs', async () => {
    await expect(
      apiClient.get('https://evil.example/api/backend/jobs'),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BFF_UNSAFE_REQUEST',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects BFF requests configured with no-cors mode', async () => {
    await expect(
      apiClient.get('/jobs', { mode: 'no-cors' as RequestMode }),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BFF_UNSAFE_REQUEST',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('normalizes BFF 401 and 403 messages to safe defaults', async () => {
    fetchMock
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ detail: 'raw auth detail' }, 401),
      )
      .mockResolvedValueOnce(
        responseHelpers.jsonResponse({ detail: 'raw forbidden detail' }, 403),
      );

    await expect(apiClient.get('/auth-required')).rejects.toMatchObject({
      status: 401,
      code: 'BFF_AUTH_REQUIRED',
      message: 'Authentication required. Please sign in again.',
    });

    await expect(apiClient.post('/forbidden', {})).rejects.toMatchObject({
      status: 403,
      code: 'BFF_FORBIDDEN',
      message:
        'Request blocked by security policy. Please refresh and try again.',
    });
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValue(
      responseHelpers.textResponse('', 204, { 'content-type': '' }),
    );

    const resp = await apiClient.delete('/noop');

    expect(resp).toBeUndefined();
  });

  it('handles malformed JSON bodies gracefully', async () => {
    const badJsonResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => {
        throw new Error('bad json');
      },
      text: async () => {
        throw new Error('should not call text');
      },
    } as unknown as Response;

    fetchMock.mockResolvedValue(badJsonResponse);

    const resp = await apiClient.get('/bad-json');
    expect(resp).toBeUndefined();
  });

  it('handles text body failures gracefully', async () => {
    const textFailResponse = {
      ok: true,
      status: 200,
      headers: { get: () => 'text/plain' },
      json: async () => {
        throw new Error('not json');
      },
      text: async () => {
        throw new Error('text read failed');
      },
    } as unknown as Response;

    fetchMock.mockResolvedValue(textFailResponse);

    const resp = await apiClient.get('/text-fail');
    expect(resp).toBeUndefined();
  });

  it('supports delete with request options and explicit basePath', async () => {
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
        body: undefined,
        credentials: 'omit',
      }),
    );
  });

  it('supports put and patch helpers', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.put('/items/1', { name: 'Item' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/items/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Item' }),
      }),
    );

    await apiClient.patch('/items/1', { name: 'Patch' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/items/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Patch' }),
      }),
    );
  });

  it('ignores provided authToken in browser request options', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({}, 200));

    await apiClient.post('/auth', { ok: true }, { authToken: 'tok' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/auth',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ok: true }),
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    );
  });

  it('keeps GET headers empty even if authToken option is passed', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.get('/auth-pref', { authToken: 'from-opts' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/backend/auth-pref',
      expect.objectContaining({
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'same-origin',
        cache: 'no-store',
      }),
    );
  });

  it('merges explicit request headers for put/patch/delete without auth headers', async () => {
    fetchMock
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }))
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }))
      .mockResolvedValueOnce(responseHelpers.jsonResponse({ ok: true }));

    await apiClient.put(
      '/put-me',
      { a: 1 },
      { headers: { 'X-Test': 'one' } },
      { authToken: 'custom-token' },
    );

    await apiClient.patch('/patch-me', { b: 2 }, { authToken: 'custom-token' });
    await apiClient.delete('/delete-me', { headers: { 'X-Req': 'del' } });

    const putCall = fetchMock.mock.calls[0] as unknown[];
    const patchCall = fetchMock.mock.calls[1] as unknown[];
    const deleteCall = fetchMock.mock.calls[2] as unknown[];

    expect(putCall[0]).toBe('/api/backend/put-me');
    expect(putCall[1]).toMatchObject({
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Test': 'one',
      },
    });

    expect(patchCall[1]).toMatchObject({
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(deleteCall[1]).toMatchObject({
      method: 'DELETE',
      headers: {},
    });
  });

  it('safeRequest returns data and wraps unknown errors', async () => {
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
