import {
  GET,
  NextRequest,
  type FakeResponseShape,
  setupBackendProxyRouteTest,
  teardownBackendProxyRouteTest,
  restoreBackendProxyRouteTest,
  upstreamRequestMock,
} from './backendProxyRoute.testlib';

describe('/api/backend proxy - upstream timeout failures', () => {
  beforeEach(setupBackendProxyRouteTest);
  afterEach(teardownBackendProxyRouteTest);
  afterAll(restoreBackendProxyRouteTest);

  it('times out and returns an error response', async () => {
    upstreamRequestMock.mockImplementationOnce(async () => {
      throw new Error('Request timed out after 20000ms');
    });

    const res = await GET(
      new NextRequest('http://localhost/api/backend/slow') as never,
      { params: Promise.resolve({ path: ['slow'] }) },
    );

    expect(res.status).toBe(502);
    expect((res as FakeResponseShape).body).toEqual(
      expect.objectContaining({ message: 'Upstream request failed' }),
    );
    expect(res.headers.get('x-winoe-request-id')).toBe('req-test');
  });
});
