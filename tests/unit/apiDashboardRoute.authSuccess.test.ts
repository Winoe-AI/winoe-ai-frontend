import {
  BFF_HEADER,
  GET,
  NextRequest,
  NextResponse,
  makeUpstreamResponse,
  parseUpstreamBodyMock,
  requireBffAuthMock,
  resetDashboardRouteMocks,
  upstreamRequestMock,
} from './apiDashboardRoute.testlib';

describe('/api/dashboard route auth + success', () => {
  beforeEach(() => {
    resetDashboardRouteMocks();
  });

  it('returns auth failure when guard fails', async () => {
    const cookies = NextResponse.next();
    requireBffAuthMock.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 },
      ),
      cookies,
    });
    const req = new NextRequest('http://localhost/api/dashboard');
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    expect(res.headers.get('x-winoe-request-id')).toBe('req-123');
  });

  it('returns combined payload and sets headers', async () => {
    const cookies = NextResponse.next();
    cookies.cookies.set('edge', 'refresh');
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'token-abc',
      permissions: ['talent_partner:access'],
      session: {},
      cookies,
    });
    upstreamRequestMock
      .mockResolvedValueOnce(
        makeUpstreamResponse({ name: 'TalentPartner' }, 200),
      )
      .mockResolvedValueOnce(
        makeUpstreamResponse(
          [{ id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' }],
          200,
        ),
      );
    parseUpstreamBodyMock.mockImplementation(async (res: Response) =>
      (res as { json: () => unknown }).json(),
    );

    const req = new NextRequest('http://localhost/api/dashboard', {
      headers: { 'x-winoe-request-id': 'incoming-id' },
    });
    const res = await GET(req as never);

    expect(upstreamRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://backend.test/api/auth/me',
        requestId: 'req-123',
      }),
    );
    expect(upstreamRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://backend.test/api/trials',
        requestId: 'req-123',
      }),
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      profile: { name: 'TalentPartner' },
      trials: [{ id: '1', title: 'Sim', role: 'Eng', createdAt: '2024-01-01' }],
      profileError: null,
      trialsError: null,
    });
    expect(res.headers.get(BFF_HEADER)).toBe('dashboard');
    expect(res.headers.get('x-winoe-upstream-status')).toBe('200');
    expect(res.cookies.get('edge')?.value).toBe('refresh');
  });

  it('threads request signal to upstream calls', async () => {
    requireBffAuthMock.mockResolvedValue({
      ok: true,
      accessToken: 'token',
      permissions: ['talent_partner:access'],
      session: {},
      cookies: NextResponse.next(),
    });
    upstreamRequestMock.mockResolvedValue(makeUpstreamResponse({}, 200));
    const req = new NextRequest('http://localhost/api/dashboard');
    await GET(req as never);
    expect(upstreamRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ signal: req.signal }),
    );
  });
});
