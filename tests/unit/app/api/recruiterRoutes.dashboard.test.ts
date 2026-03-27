import {
  MockNextRequest,
  makeResponse,
  parseUpstreamBodyMock,
  resetRecruiterRouteMocks,
  restoreRecruiterRouteEnv,
  upstreamRequestMock,
} from './recruiterRoutes.testlib';

describe('recruiter dashboard route', () => {
  const modulePath = '@/app/api/dashboard/route';

  beforeEach(() => {
    resetRecruiterRouteMocks();
  });

  afterAll(() => {
    restoreRecruiterRouteEnv();
  });

  it('returns unauthorized when profile upstream returns 401', async () => {
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ message: 'nope' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    parseUpstreamBodyMock
      .mockResolvedValueOnce({ message: 'nope' })
      .mockResolvedValueOnce([]);

    const { GET } = await import(modulePath);
    const resp = await GET(new MockNextRequest('http://localhost/api/dash'));
    expect(resp.status).toBe(401);
    expect(resp.headers.get('x-upstream')).toBe('401');
    expect(resp.headers.get('x-tenon-upstream-status-profile')).toBe('401');
  });

  it('returns forbidden when simulations upstream is 403', async () => {
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ name: 'Recruiter' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ message: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    );
    parseUpstreamBodyMock
      .mockResolvedValueOnce({ name: 'Recruiter' })
      .mockResolvedValueOnce({ message: 'forbidden' });

    const { GET } = await import(modulePath);
    const resp = await GET(new MockNextRequest('http://localhost/api/dash'));
    expect(resp.status).toBe(403);
    expect(resp.headers.get('x-upstream')).toBe('403');
  });

  it('returns combined payload with upstream errors', async () => {
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ message: 'profile down' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );
    upstreamRequestMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ message: 'sims fail' }), {
        status: 502,
        headers: { 'content-type': 'application/json' },
      }),
    );
    parseUpstreamBodyMock
      .mockResolvedValueOnce({ message: 'profile down' })
      .mockResolvedValueOnce({ message: 'sims fail' });

    const { GET } = await import(modulePath);
    const resp = await GET(new MockNextRequest('http://localhost/api/dash'));
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchObject({
      profile: null,
      simulations: [],
      profileError: 'profile down',
      simulationsError: 'sims fail',
    });
  });

  it('includes retry count in server timing', async () => {
    const profileResp = makeResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as Response & { _tenonMeta?: unknown };
    profileResp._tenonMeta = { attempts: 2, durationMs: 10 };
    const simsResp = makeResponse(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }) as Response & { _tenonMeta?: unknown };
    simsResp._tenonMeta = { attempts: 1, durationMs: 5 };

    upstreamRequestMock.mockResolvedValueOnce(profileResp);
    upstreamRequestMock.mockResolvedValueOnce(simsResp);
    parseUpstreamBodyMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce([]);

    const { GET } = await import(modulePath);
    const resp = await GET(new MockNextRequest('http://localhost/api/dash'));
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Server-Timing')).toContain('retry;desc="count=1"');
    expect(resp.headers.get('x-tenon-bff')).toBe('dashboard');
  });
});
