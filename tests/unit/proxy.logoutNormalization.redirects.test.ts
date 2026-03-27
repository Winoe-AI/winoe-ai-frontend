import {
  NextRequest,
  getSessionNormalizedMock,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - logout normalization redirects', () => {
  beforeEach(resetProxyTestMocks);

  it('adds root returnTo when missing', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(
      new NextRequest(new URL('http://localhost/auth/logout')),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2F',
    );
    expect(getSessionNormalizedMock).not.toHaveBeenCalled();
  });

  it('normalizes external logout returnTo to root', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(
      new NextRequest(
        new URL(
          'http://localhost/auth/logout?returnTo=https%3A%2F%2Fevil.com%2Fphish',
        ),
      ),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2F',
    );
  });

  it('normalizes relative logout returnTo to root', async () => {
    getSessionNormalizedMock.mockResolvedValue(null);
    const res = await proxy(
      new NextRequest(
        new URL('http://localhost/auth/logout?returnTo=%2Fdashboard'),
      ),
    );
    expect(res?.status).toBe(307);
    expect(res?.headers.get('location')).toBe(
      'http://localhost/auth/logout?returnTo=http%3A%2F%2Flocalhost%2F',
    );
  });
});
