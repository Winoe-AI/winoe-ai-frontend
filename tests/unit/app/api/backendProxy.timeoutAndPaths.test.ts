import {
  MockNextRequest,
  importBackendProxyRoute,
  makeResponse,
  resetBackendProxyTestState,
  restoreBackendProxyTestEnv,
  upstreamRequestMock,
} from './backendProxy.testlib';

describe('api/backend proxy route - timeout and path handling', () => {
  beforeEach(resetBackendProxyTestState);
  afterAll(restoreBackendProxyTestEnv);

  it('uses long timeout for run endpoints', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const { POST } = await importBackendProxyRoute();
    await POST(new MockNextRequest('http://localhost/api/backend/tasks/123/run', { method: 'POST', bodyText: '{}' }), { params: Promise.resolve({ path: ['tasks', '123', 'run'] }) });
    expect(upstreamRequestMock).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 90000 }));
  });

  it('uses long timeout for codespace init/status endpoints', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'application/json' } }));
    const { POST, GET } = await importBackendProxyRoute();
    await POST(new MockNextRequest('http://localhost/api/backend/tasks/x/codespace/init', { method: 'POST', bodyText: '{}' }), { params: Promise.resolve({ path: ['tasks', 'x', 'codespace', 'init'] }) });
    await GET(new MockNextRequest('http://localhost/api/backend/tasks/x/codespace/status', { method: 'GET' }), { params: Promise.resolve({ path: ['tasks', 'x', 'codespace', 'status'] }) });
    expect(upstreamRequestMock).toHaveBeenCalledWith(expect.objectContaining({ timeoutMs: 90000 }));
  });

  it('handles string rawPath param and empty path', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'text/plain' } }));
    const { GET } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/raw');
    await GET(req, { params: Promise.resolve({ path: 'single' }) });
    await GET(req, { params: Promise.resolve({ path: [] as string[] }) });
    expect(upstreamRequestMock).toHaveBeenCalled();
  });

  it('handles nullish search param on request', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'text/plain' } }));
    const { GET } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/search');
    (req as unknown as { nextUrl: { search?: string; pathname: string } }).nextUrl = { search: undefined, pathname: '/api/backend/search' };
    await GET(req, { params: Promise.resolve({ path: [] as string[] }) });
    expect(upstreamRequestMock).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('/api/') }));
  });

  it('retains non hop-by-hop headers when forwarding', async () => {
    upstreamRequestMock.mockResolvedValue(makeResponse('ok', { status: 200, headers: { 'content-type': 'text/plain' } }));
    const { GET } = await importBackendProxyRoute();
    const req = new MockNextRequest('http://localhost/api/backend/echo', { headers: { 'x-custom': 'abc' } });
    await GET(req, { params: Promise.resolve({ path: ['echo'] }) });
    expect(upstreamRequestMock).toHaveBeenCalledWith(expect.objectContaining({ headers: expect.objectContaining({ 'x-custom': 'abc' }) }));
  });
});
