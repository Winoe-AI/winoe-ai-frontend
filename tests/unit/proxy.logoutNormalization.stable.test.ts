import {
  NextRequest,
  getSessionNormalizedMock,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - logout normalization stable paths', () => {
  beforeEach(resetProxyTestMocks);

  it('normalizes same-origin absolute logout returnTo to root-only', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const req = new NextRequest(
      new URL(
        'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2Fdashboard',
      ),
    );
    const res = await proxy(req);
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2F',
    );
  });

  it('does not redirect when logout returnTo is already root', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const req = new NextRequest(
      new URL(
        'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2F',
      ),
    );
    const res = await proxy(req);
    expect(res?.headers.get('location')).toBeNull();
  });
});
