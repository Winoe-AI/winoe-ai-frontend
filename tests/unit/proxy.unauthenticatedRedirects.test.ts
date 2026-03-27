import {
  NextRequest,
  getSessionNormalizedMock,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - unauthenticated redirects', () => {
  beforeEach(resetProxyTestMocks);

  it('redirects unauthenticated candidate dashboard access to login', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const req = new NextRequest(new URL('http://localhost/candidate/dashboard'));
    const res = await proxy(req);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/login?mode=candidate&returnTo=%2Fcandidate%2Fdashboard',
    );
    expect(getSessionNormalizedMock).toHaveBeenCalled();
  });

  it('redirects unauthenticated recruiter dashboard to login with mode', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/login?mode=recruiter&returnTo=%2Fdashboard',
    );
  });
});
