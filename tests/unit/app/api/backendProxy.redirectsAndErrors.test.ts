import {
  MockNextRequest,
  importBackendProxyRoute,
  makeResponse,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
} from './backendProxy.testlib';

describe('api/backend proxy route - redirects and upstream errors', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('blocks upstream redirects and strips location header', async () => {
    upstreamRequestMock.mockResolvedValue(
      makeResponse('', {
        status: 302,
        headers: { location: 'http://redirected' },
      }),
    );
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/health'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(502);
    expect(resp.headers.get('x-upstream')).toBe('302');
    expect(resp.headers.get('location')).toBeNull();
  });

  it('returns 502 when upstreamRequest throws', async () => {
    upstreamRequestMock.mockRejectedValue(new Error('boom'));
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/err'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(502);
    expect(resp.headers.get('x-upstream')).toBe('502');
  });

  it('returns 502 detail without Error instance', async () => {
    upstreamRequestMock.mockRejectedValue('string failure');
    const { GET } = await importBackendProxyRoute();
    const resp = await GET(
      new MockNextRequest('http://localhost/api/backend/string-error'),
      { params: Promise.resolve({ path: [] }) },
    );
    expect(resp.status).toBe(502);
    expect(resp.body).toEqual({
      message: 'Upstream request failed',
      detail: undefined,
    });
  });
});
