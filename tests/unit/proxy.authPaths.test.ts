import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - auth paths', () => {
  beforeEach(resetProxyTestMocks);

  it('passes through other /auth/* pages without extra redirects', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('persist', '1');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(
      new NextRequest(new URL('http://localhost/auth/clear')),
    );
    expect(res?.status).toBe(200);
    expect(res?.cookies.getAll().find((c) => c.name === 'persist')?.value).toBe(
      '1',
    );
  });

  it('lets unknown auth paths skip auth and return next response', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('auth', 'pass');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(
      new NextRequest(new URL('http://localhost/auth/reset')),
    );
    expect(res?.status).toBe(200);
    expect(res?.cookies.getAll().find((c) => c.name === 'auth')?.value).toBe(
      'pass',
    );
  });

  it('falls back to NextResponse.next when auth proxy returns non-response on auth path', async () => {
    mockAuth0.middleware.mockResolvedValue(null);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(
      new NextRequest(new URL('http://localhost/auth/reset')),
    );
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
  });
});
