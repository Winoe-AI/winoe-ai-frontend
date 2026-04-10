import {
  CUSTOM_CLAIM_PERMISSIONS,
  CUSTOM_CLAIM_ROLES,
} from '@/platform/config/brand';
import {
  NextRequest,
  NextResponse,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - talent_partner access rules', () => {
  beforeEach(resetProxyTestMocks);

  it('redirects candidates hitting talent_partner pages to not authorized', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['candidate:access'] },
    });
    const res = await proxy(
      new NextRequest(new URL('http://localhost/dashboard')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=talent_partner&returnTo=%2Fdashboard',
    );
  });

  it('redirects empty-permission users hitting talent_partner pages to not authorized', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: [] } });
    const res = await proxy(
      new NextRequest(new URL('http://localhost/dashboard')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=talent_partner&returnTo=%2Fdashboard',
    );
  });

  it('allows talent_partner via namespaced permission claims and mapped roles', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { [CUSTOM_CLAIM_PERMISSIONS]: ['talent_partner:access'] },
    });
    expect(
      (await proxy(new NextRequest(new URL('http://localhost/dashboard'))))
        ?.status,
    ).toBe(200);

    getSessionNormalizedMock.mockResolvedValue({
      user: {
        permissions: [],
        [CUSTOM_CLAIM_PERMISSIONS]: ['talent_partner:access'],
      },
    });
    expect(
      (await proxy(new NextRequest(new URL('http://localhost/dashboard'))))
        ?.status,
    ).toBe(200);

    getSessionNormalizedMock.mockResolvedValue({
      user: { [CUSTOM_CLAIM_ROLES]: ['TalentPartner'] },
    });
    expect(
      (await proxy(new NextRequest(new URL('http://localhost/dashboard'))))
        ?.status,
    ).toBe(200);
  });

  it('denies talent partner dashboard when claim has candidate only', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { [CUSTOM_CLAIM_PERMISSIONS]: ['candidate:access'] },
    });
    const res = await proxy(
      new NextRequest(new URL('http://localhost/dashboard')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toContain('/not-authorized');
  });

  it('blocks talent_partners from candidate pages', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['talent_partner:access'] },
    });
    const res = await proxy(
      new NextRequest(new URL('http://localhost/candidate/dashboard')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/not-authorized?mode=candidate&returnTo=%2Fcandidate%2Fdashboard',
    );
  });

  it('returns next when talent_partner is authorized for dashboard', async () => {
    const authResp = NextResponse.next();
    authResp.cookies.set('edge', 'cookie');
    mockAuth0.middleware.mockResolvedValue(authResp);
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['talent_partner:access'] },
      accessToken: 'abc',
    });
    const res = await proxy(
      new NextRequest(new URL('http://localhost/dashboard/overview')),
    );
    expect(res?.status).toBe(200);
    expect(res?.cookies.getAll().find((c) => c.name === 'edge')?.value).toBe(
      'cookie',
    );
  });
});
