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

describe('/api/backend proxy - submit request body and timeout handling', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('forwards empty json bodies for submit requests', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ submissionId: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const res = await POST(
      new NextRequest('http://localhost/api/backend/tasks/321/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '321', 'submit'] }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://backend.test/api/tasks/321/submit',
      expect.objectContaining({ body: '{}' }),
    );
    expect(res.status).toBe(200);
  });

  it('uses a longer timeout for task submit endpoints', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(JSON.stringify({ submissionId: 2 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await POST(
      new NextRequest('http://localhost/api/backend/tasks/777/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }) as never,
      { params: Promise.resolve({ path: ['tasks', '777', 'submit'] }) },
    );

    expect(upstreamRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 90000, maxTotalTimeMs: 90000 }),
    );
  });
});
