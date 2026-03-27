import {
  GET,
  NextRequest,
  POST,
  fetchMock,
  mockResponse,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - method and origin guards', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('rejects GET on mutation routes with 405', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/backend/tasks/123/submit', {
        method: 'GET',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '123', 'submit'] }) },
    );

    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
    expect(res.headers.get('x-tenon-upstream-status')).toBe('405');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks cross-site origin on cookie-authenticated mutations', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/backend/tasks/123/run', {
        method: 'POST',
        headers: {
          cookie: 'appSession=test',
          origin: 'https://evil.example',
          'content-type': 'application/json',
        },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) },
    );

    expect(res.status).toBe(403);
    expect(res.headers.get('x-tenon-upstream-status')).toBe('403');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows same-origin mutation requests when origin matches', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await POST(
      new NextRequest('http://localhost/api/backend/tasks/123/run', {
        method: 'POST',
        headers: {
          cookie: 'appSession=test',
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) },
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
