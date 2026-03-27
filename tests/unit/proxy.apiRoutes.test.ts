import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - public and api routes', () => {
  beforeEach(resetProxyTestMocks);

  it('allows public home when logged out', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(new NextRequest(new URL('http://localhost/')));
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
  });

  it('handles non-NextResponse auth proxy output gracefully', async () => {
    mockAuth0.middleware.mockResolvedValue(null);
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(new NextRequest(new URL('http://localhost/')));
    expect(res?.status).toBe(200);
  });

  it('returns next for API routes and preserves auth cookies', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('a', 'b');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(
      new NextRequest(new URL('http://localhost/api/simulations')),
    );
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
    expect(res?.cookies.getAll().find((c) => c.name === 'a')?.value).toBe('b');
  });

  it('returns next for bare /api and does not redirect', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('api', 'root');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue(null);

    const res = await proxy(new NextRequest(new URL('http://localhost/api')));
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
    expect(res?.cookies.getAll().find((c) => c.name === 'api')?.value).toBe(
      'root',
    );
    expect(getSessionNormalizedMock).not.toHaveBeenCalled();
  });

  it('treats /apiary as non-api and applies auth gating', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(
      new NextRequest(new URL('http://localhost/apiary')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/auth/login');
  });
});
