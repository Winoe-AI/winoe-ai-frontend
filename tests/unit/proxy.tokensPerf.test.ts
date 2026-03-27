import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - token normalization and perf logging', () => {
  beforeEach(resetProxyTestMocks);

  it('logs perf timing and normalizes nested token object', async () => {
    const prevEnv = process.env.TENON_DEBUG_PERF;
    process.env.TENON_DEBUG_PERF = 'true';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['candidate:access'] },
      accessToken: { token: 'nested-token' },
    });

    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/notes')));
    expect(res?.status).toBe(200);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    if (prevEnv === undefined) delete process.env.TENON_DEBUG_PERF;
    else process.env.TENON_DEBUG_PERF = prevEnv;
  });

  it('normalizes access token object lacking string token', async () => {
    mockAuth0.middleware.mockResolvedValue(NextResponse.next());
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['candidate:access'] },
      accessToken: { token: 123 },
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/board')));
    expect(res?.status).toBe(200);
  });

  it('redirects root visitors with recruiter access and object access token', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('edge', 'cookie');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['recruiter:access'] },
      accessToken: { accessToken: 'root-token' },
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe('http://localhost/dashboard');
    expect(res?.cookies.getAll().find((c) => c.name === 'edge')?.value).toBe('cookie');
  });
});
