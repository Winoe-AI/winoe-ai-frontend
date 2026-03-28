import {
  GET,
  NextRequest,
  type FakeResponseShape,
  fetchMock,
  mockResponse,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - redirect and retry behavior', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('blocks upstream redirects and strips location header', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse('', {
        status: 302,
        headers: { location: 'https://example.com' },
      }),
    );

    const res = await GET(
      new NextRequest('http://localhost/api/backend/baz') as never,
      { params: Promise.resolve({ path: ['baz'] }) },
    );

    expect(res.status).toBe(502);
    expect((res as FakeResponseShape).body).toEqual({
      message: 'Upstream redirect blocked',
      upstreamStatus: 302,
    });
    expect(res.headers.get('x-tenon-upstream-status')).toBe('302');
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-tenon-request-id')).toBe('req-test');
  });

  it('retries GET on transient errors', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(JSON.stringify({}), { status: 503 }))
      .mockResolvedValueOnce(
        mockResponse(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const res = await GET(
      new NextRequest('http://localhost/api/backend/retryable-read') as never,
      { params: Promise.resolve({ path: ['retryable-read'] }) },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-tenon-upstream-status')).toBe('200');
  });
});
