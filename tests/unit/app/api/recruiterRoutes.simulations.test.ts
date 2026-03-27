import {
  MockNextRequest,
  MockNextResponse,
  forwardJsonMock,
  resetRecruiterRouteMocks,
  restoreRecruiterRouteEnv,
} from './recruiterRoutes.testlib';

describe('recruiter simulations routes', () => {
  beforeEach(() => {
    resetRecruiterRouteMocks();
    forwardJsonMock.mockResolvedValue(new MockNextResponse({ ok: true }));
  });

  afterAll(() => {
    restoreRecruiterRouteEnv();
  });

  it('GET /api/simulations forwards with auth', async () => {
    const { GET } = await import('@/app/api/simulations/route');
    const resp = await GET(new MockNextRequest('http://localhost/api/sim'));
    expect(resp.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/api/simulations', accessToken: 'token-123', requestId: 'req-1' }));
  });

  it('POST /api/simulations returns 400 for invalid JSON', async () => {
    const { POST } = await import('@/app/api/simulations/route');
    const req = new MockNextRequest('http://localhost/api/sim', { method: 'POST', bodyText: 'not-json' });
    const resp = await POST(req, { params: Promise.resolve({} as Record<string, never>) });
    expect(resp.status).toBe(400);
  });

  it('POST /api/simulations forwards parsed body', async () => {
    const { POST } = await import('@/app/api/simulations/route');
    const req = new MockNextRequest('http://localhost/api/sim', { method: 'POST', bodyText: JSON.stringify({ title: 'New Sim' }) });
    const resp = await POST(req, { params: Promise.resolve({} as Record<string, never>) });
    expect(resp.status).toBe(200);
    expect(forwardJsonMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/api/simulations', method: 'POST', body: { title: 'New Sim' } }));
  });

  it.each([
    ['@/app/api/simulations/[id]/route', { id: 'abc 123' }, '/api/simulations/abc%20123'],
    ['@/app/api/simulations/[id]/candidates/route', { id: 'sim-9' }, '/api/simulations/sim-9/candidates'],
    ['@/app/api/simulations/[id]/candidates/compare/route', { id: 'sim-9' }, '/api/simulations/sim-9/candidates/compare'],
  ])('forwards %s to expected backend path', async (modulePath, params, path) => {
    const { GET } = await import(modulePath);
    await GET(new MockNextRequest('http://x'), { params: Promise.resolve(params as Record<string, string>) });
    expect(forwardJsonMock).toHaveBeenCalledWith(expect.objectContaining({ path }));
  });

  it('POST invite uses empty body when JSON parsing fails', async () => {
    const { POST } = await import('@/app/api/simulations/[id]/invite/route');
    const req = new MockNextRequest('http://x', { method: 'POST', bodyText: 'invalid' });
    await POST(req, { params: Promise.resolve({ id: 'sim-1' }) });
    expect(forwardJsonMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/api/simulations/sim-1/invite', body: {} }));
  });

  it('resend invite forwards to candidate-specific path', async () => {
    const { POST } = await import('@/app/api/simulations/[id]/candidates/[candidateSessionId]/invite/resend/route');
    await POST(new MockNextRequest('http://x'), { params: Promise.resolve({ id: 'sim-1', candidateSessionId: 'cand-7' }) });
    expect(forwardJsonMock).toHaveBeenCalledWith(expect.objectContaining({ path: '/api/simulations/sim-1/candidates/cand-7/invite/resend' }));
  });
});
