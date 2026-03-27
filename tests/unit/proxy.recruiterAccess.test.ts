import { CUSTOM_CLAIM_PERMISSIONS, CUSTOM_CLAIM_ROLES } from '@/lib/brand';
import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - recruiter access rules', () => {
  beforeEach(resetProxyTestMocks);

  it('redirects candidates hitting recruiter pages to not authorized', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: ['candidate:access'] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=recruiter&returnTo=%2Fdashboard',
    );
  });

  it('redirects empty-permission users hitting recruiter pages to not authorized', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: [] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=recruiter&returnTo=%2Fdashboard',
    );
  });

  it('allows recruiter via namespaced permission claims and mapped roles', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { [CUSTOM_CLAIM_PERMISSIONS]: ['recruiter:access'] } });
    expect((await proxy(new NextRequest(new URL('http://localhost/dashboard'))))?.status).toBe(200);

    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: [], [CUSTOM_CLAIM_PERMISSIONS]: ['recruiter:access'] },
    });
    expect((await proxy(new NextRequest(new URL('http://localhost/dashboard'))))?.status).toBe(200);

    getSessionNormalizedMock.mockResolvedValue({ user: { [CUSTOM_CLAIM_ROLES]: ['Recruiter'] } });
    expect((await proxy(new NextRequest(new URL('http://localhost/dashboard'))))?.status).toBe(200);
  });

  it('denies recruiter dashboard when claim has candidate only', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { [CUSTOM_CLAIM_PERMISSIONS]: ['candidate:access'] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/not-authorized');
  });

  it('blocks recruiters from candidate pages', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: ['recruiter:access'] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/dashboard')));
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=candidate&returnTo=%2Fcandidate%2Fdashboard',
    );
  });

  it('returns next when recruiter is authorized for dashboard', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('edge', 'cookie');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: ['recruiter:access'] }, accessToken: 'abc' });
    const res = await proxy(new NextRequest(new URL('http://localhost/dashboard/overview')));
    expect(res?.status).toBe(200);
    expect(res?.cookies.getAll().find((c) => c.name === 'edge')?.value).toBe('cookie');
  });
});
