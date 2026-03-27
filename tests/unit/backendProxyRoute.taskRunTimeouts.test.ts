import {
  NextRequest,
  POST,
  fetchMock,
  mockResponse,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
  upstreamRequestMock,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - run request body and timeout handling', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('forwards empty json body strings for POST run requests', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ runId: 'run-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await POST(
      new NextRequest('http://localhost/api/backend/tasks/123/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.test/api/tasks/123/run',
      expect.objectContaining({ body: '{}' }),
    );
    expect(res.status).toBe(200);
  });

  it('uses a longer timeout for task run endpoints', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ runId: 'run-2' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await POST(
      new NextRequest('http://localhost/api/backend/tasks/987/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '987', 'run'] }) },
    );

    expect(upstreamRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 90000, maxTotalTimeMs: 90000 }),
    );
  });
});
