import {
  GET,
  NextRequest,
  NextResponse,
  makeUpstreamResponse,
  requireBffAuthMock,
  resetDashboardRouteMocks,
  upstreamRequestMock,
} from './apiDashboardRoute.testlib';

describe('/api/dashboard route failure behavior', () => {
  beforeEach(() => {
    resetDashboardRouteMocks();
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'token',
      permissions: ['recruiter:access'],
      session: {},
      cookies: NextResponse.next(),
    });
  });

  it('propagates auth/me 401', async () => {
    upstreamRequestMock
      .mockResolvedValueOnce(
        makeUpstreamResponse({ message: 'Not authenticated' }, 401),
      )
      .mockResolvedValueOnce(makeUpstreamResponse([], 200));
    const res = await GET(
      new NextRequest('http://localhost/api/dashboard') as never,
    );
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authenticated' });
    expect(res.headers.get('x-tenon-request-id')).toBe('req-123');
  });

  it('keeps profile when simulations request fails', async () => {
    upstreamRequestMock
      .mockResolvedValueOnce(makeUpstreamResponse({ name: 'Recruiter' }, 200))
      .mockResolvedValueOnce(
        makeUpstreamResponse({ message: 'Backend down' }, 502),
      );
    const res = await GET(
      new NextRequest('http://localhost/api/dashboard') as never,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      profile: { name: 'Recruiter' },
      simulations: [],
      profileError: null,
      simulationsError: 'Backend down',
    });
    expect(res.headers.get('x-tenon-upstream-status')).toBe('502');
  });

  it('returns partial payload when profile request rejects', async () => {
    upstreamRequestMock.mockRejectedValueOnce(new Error('profile boom'));
    upstreamRequestMock.mockResolvedValueOnce(
      makeUpstreamResponse(
        [{ id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' }],
        200,
      ),
    );
    const res = await GET(
      new NextRequest('http://localhost/api/dashboard') as never,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      profile: null,
      simulations: [
        { id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' },
      ],
      profileError: 'Unable to load your profile right now.',
      simulationsError: null,
    });
    expect(res.headers.get('x-tenon-upstream-status')).toBe('502');
  });
});
