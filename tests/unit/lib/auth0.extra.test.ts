import {
  Auth0ClientMock,
  mockAuth0Instance,
  resetAuth0ExtraMocks,
  restoreAuth0ExtraEnv,
} from './auth0.extra.testlib';

describe('lib/auth0 extra coverage (core)', () => {
  const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

  beforeEach(() => {
    resetAuth0ExtraMocks();
  });

  afterAll(() => {
    restoreAuth0ExtraEnv();
    consoleWarnSpy.mockRestore();
  });

  it('uses fallback error ID when crypto.randomUUID is unavailable', async () => {
    const originalCrypto = global.crypto;
    // @ts-expect-error test fallback
    global.crypto = { randomUUID: undefined };

    await import('@/lib/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];
    const resp = await config.onCallback({ code: 'test_error' }, { returnTo: '/test' });

    expect(resp.status).toBe(307);
    expect(resp.headers.get('location')).toMatch(/errorId=/);
    global.crypto = originalCrypto;
  });

  it('constructs Auth0Client with expected config', async () => {
    await import('@/lib/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];
    expect(config.appBaseUrl).toBe('http://localhost:3000');
    expect(config.signInReturnToPath).toBe('/dashboard');
  });

  it('handles getCachedSessionNormalized', async () => {
    mockAuth0Instance.getSession.mockResolvedValue({ user: { sub: 'cached-user' } });
    const { getCachedSessionNormalized } = await import('@/lib/auth0');
    const session = await getCachedSessionNormalized();
    expect(session?.user?.normalized).toBe(true);
  });

  it('handles non-Error callback inputs safely', async () => {
    await import('@/lib/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];
    const resp = await config.onCallback({ code: 'test' }, { returnTo: '/' });
    expect(resp.status).toBe(307);
  });
});
