import {
  Auth0ClientMock,
  getAuth0Config,
  importAuth0,
  mockAuth0Instance,
  resetAuth0TestEnv,
  restoreAuth0TestEnv,
} from './auth0.testlib';

describe('lib/auth0 session and access-token helpers', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  beforeEach(() => {
    resetAuth0TestEnv();
  });

  afterAll(() => {
    restoreAuth0TestEnv();
    consoleWarnSpy.mockRestore();
  });

  it('constructs client and normalizes user claims', async () => {
    const { getSessionNormalized } = await importAuth0();
    expect(Auth0ClientMock).toHaveBeenCalled();
    expect(getAuth0Config().authorizationParameters).toEqual(
      expect.objectContaining({ scope: process.env.WINOE_AUTH0_SCOPE }),
    );

    mockAuth0Instance.getSession.mockResolvedValue({
      user: { permissions: ['p1'] },
      accessToken: 'jwt.token.here',
    });
    const session = await getSessionNormalized();
    expect(session?.user?.normalized).toBe(true);
  });

  it('logs perf timing when debug perf is enabled', async () => {
    process.env.WINOE_DEBUG_PERF = '1';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockAuth0Instance.getSession.mockResolvedValue({
      user: { permissions: ['p1'] },
      accessToken: 'jwt.token.here',
    });
    const { getSessionNormalized } = await importAuth0();
    await getSessionNormalized();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    delete process.env.WINOE_DEBUG_PERF;
  });

  it('passes request through to getSession and returns raw no-user sessions', async () => {
    const { NextRequest } = jest.requireMock('next/server');
    const { getSessionNormalized } = await importAuth0();

    mockAuth0Instance.getSession.mockResolvedValueOnce({
      user: { sub: 'user-123' },
    });
    await getSessionNormalized(new NextRequest('http://localhost/test'));
    expect(mockAuth0Instance.getSession).toHaveBeenCalled();

    mockAuth0Instance.getSession.mockResolvedValueOnce({ accessToken: 'tok' });
    expect(await getSessionNormalized()).toEqual({ accessToken: 'tok' });
  });

  it('returns token when getAccessToken has one and throws when missing', async () => {
    const { getAccessToken } = await importAuth0();
    mockAuth0Instance.getAccessToken.mockResolvedValueOnce({
      token: 'valid-token',
    });
    await expect(getAccessToken()).resolves.toBe('valid-token');

    mockAuth0Instance.getAccessToken.mockResolvedValueOnce({ token: null });
    await expect(getAccessToken()).rejects.toThrow(/No access token found/);
  });
});
