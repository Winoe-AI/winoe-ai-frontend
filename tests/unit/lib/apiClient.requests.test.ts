import { apiClient, fetchMock, resetApiClientMocks, responseHelpers } from './apiClient.testlib';

describe('apiClient request helpers', () => {
  beforeEach(() => {
    resetApiClientMocks();
  });

  it('normalizes BFF URLs and default GET options', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));
    await apiClient.get('/jobs');
    expect(fetchMock).toHaveBeenCalledWith('/api/backend/jobs', expect.objectContaining({ method: 'GET', headers: {}, credentials: 'same-origin', cache: 'no-store' }));

    await apiClient.get('/backend/jobs', { skipCache: true }, { basePath: '/api' });
    expect(fetchMock).toHaveBeenCalledWith('/api/backend/jobs', expect.objectContaining({ method: 'GET' }));

    await apiClient.get('/api/backend/jobs', { skipCache: true }, { basePath: '/api' });
    expect(fetchMock).toHaveBeenCalledWith('/api/backend/jobs', expect.objectContaining({ method: 'GET' }));
  });

  it('respects custom basePath, skipAuth, and FormData behavior', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));
    await apiClient.post('tasks', { title: 'New' }, { basePath: 'https://api.example.com', skipAuth: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/tasks', expect.objectContaining({ method: 'POST', credentials: 'omit' }));

    const fd = new FormData();
    fd.append('file', 'content');
    await apiClient.post('/upload', fd);
    const [, opts] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(opts.body).toBe(fd);
    expect(opts.headers).not.toHaveProperty('Content-Type');
  });

  it('supports put/patch/delete helpers with merged headers', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({ ok: true }));
    await apiClient.put('/put-me', { a: 1 }, { headers: { 'X-Test': 'one' } }, { authToken: 'tok' });
    await apiClient.patch('/patch-me', { b: 2 }, { authToken: 'tok' });
    await apiClient.delete('/delete-me', { headers: { 'X-Req': 'del' } });

    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/backend/put-me');
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Test': 'one' } });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
    expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: 'DELETE', headers: {} });
  });

  it('ignores browser authToken request options', async () => {
    fetchMock.mockResolvedValue(responseHelpers.jsonResponse({}, 200));
    await apiClient.post('/auth', { ok: true }, { authToken: 'tok' });
    await apiClient.get('/auth-pref', { authToken: 'from-opts' });

    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: 'GET', headers: {} });
  });
});
