import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - auth login', () => {
  beforeEach(resetProxyTestMocks);

  it('allows auth login route when logged out preserving query', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const req = new NextRequest(
      new URL('http://localhost/auth/login?mode=recruiter&returnTo=%2Fdashboard'),
    );
    const res = await proxy(req);
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
  });

  it('redirects logged-in recruiter hitting auth login to dashboard', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('edge', 'cookie');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['recruiter:access'] },
      accessToken: 't',
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/auth/login')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost/dashboard');
    expect(res?.cookies.getAll().find((c) => c.name === 'edge')?.value).toBe('cookie');
  });

  it('redirects logged-in candidate hitting auth login to candidate dashboard', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['candidate:access'] },
      accessToken: 't',
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/auth/login')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost/candidate/dashboard');
  });
});
