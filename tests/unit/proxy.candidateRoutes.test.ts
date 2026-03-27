import {
  NextRequest,
  getSessionNormalizedMock,
  mockAuth0,
  proxy,
  resetProxyTestMocks,
} from './proxy.testlib';

describe('proxy - candidate route access', () => {
  beforeEach(resetProxyTestMocks);

  it('sends authorized candidates through candidate routes', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['candidate:access'] },
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/session/tok_123')));
    expect(res?.headers.get('location')).toBeNull();
    expect(mockAuth0.middleware).toHaveBeenCalled();
  });

  it('allows authenticated users without recruiter access to hit candidate routes', async () => {
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: [] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/session/tok_123')));
    expect(res?.headers.get('location')).toBeNull();
  });

  it('allows dual-permission users to access candidate routes', async () => {
    getSessionNormalizedMock.mockResolvedValue({
      user: { permissions: ['recruiter:access', 'candidate:access'] },
    });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/session/tok_123')));
    expect(res?.headers.get('location')).toBeNull();
  });

  it('passes through when authResponse is null but user already authorized', async () => {
    mockAuth0.middleware.mockResolvedValue(null);
    getSessionNormalizedMock.mockResolvedValue({ user: { permissions: ['candidate:access'] } });
    const res = await proxy(new NextRequest(new URL('http://localhost/candidate/updates')));
    expect(res?.status).toBe(200);
    expect(res?.headers.get('location')).toBeNull();
  });
});
