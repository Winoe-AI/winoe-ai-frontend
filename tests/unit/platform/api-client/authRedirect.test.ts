const buildLoginUrlMock = jest.fn();
const buildNotAuthorizedUrlMock = jest.fn();
const buildReturnToMock = jest.fn();

jest.mock('@/platform/auth/routing', () => ({
  buildLoginUrl: (...args: unknown[]) => buildLoginUrlMock(...args),
  buildNotAuthorizedUrl: (...args: unknown[]) =>
    buildNotAuthorizedUrlMock(...args),
  buildReturnTo: (...args: unknown[]) => buildReturnToMock(...args),
}));

describe('authRedirect', () => {
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  function setUserAgent(userAgent: string) {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent },
      configurable: true,
    });
  }

  function setWindow(assign = jest.fn()) {
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          assign,
          pathname: '/dashboard',
          search: '?view=1',
        },
      },
      configurable: true,
    });
    return assign;
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    buildReturnToMock.mockReturnValue('/dashboard?view=1');
    buildLoginUrlMock.mockImplementation(
      (mode: string) => `/auth/login?mode=${mode}`,
    );
    buildNotAuthorizedUrlMock.mockImplementation(
      (mode: string) => `/not-authorized?mode=${mode}`,
    );
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      configurable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      configurable: true,
    });
  });

  it('returns undefined in jsdom environments', async () => {
    setUserAgent('Mozilla/5.0 jsdom/24.0.0');
    setWindow();

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    expect(authRedirect(401, 'recruiter')).toBeUndefined();
    expect(authRedirect(403, 'candidate')).toBeUndefined();
  });

  it('returns undefined for non-auth statuses', async () => {
    setUserAgent('Mozilla/5.0 Chrome');
    setWindow();

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    expect(authRedirect(500, 'recruiter')).toBeUndefined();
    expect(authRedirect(null, 'candidate')).toBeUndefined();
  });

  it('returns undefined when window is unavailable (non-browser)', async () => {
    setUserAgent('Mozilla/5.0 Chrome');
    // @ts-expect-error test override
    delete global.window;

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    expect(authRedirect(401, 'recruiter')).toBeUndefined();
  });

  it('builds and executes recruiter login redirect for 401', async () => {
    setUserAgent('Mozilla/5.0 Chrome');
    const assign = setWindow();

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    const redirect = authRedirect(401, 'recruiter');

    expect(typeof redirect).toBe('function');
    redirect?.();

    expect(buildReturnToMock).toHaveBeenCalledTimes(1);
    expect(buildLoginUrlMock).toHaveBeenCalledWith(
      'recruiter',
      '/dashboard?view=1',
    );
    expect(assign).toHaveBeenCalledWith('/auth/login?mode=recruiter');
  });

  it('builds and executes candidate not-authorized redirect for 403', async () => {
    setUserAgent('Mozilla/5.0 Chrome');
    const assign = setWindow();

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    const redirect = authRedirect(403, 'candidate');
    redirect?.();

    expect(buildNotAuthorizedUrlMock).toHaveBeenCalledWith(
      'candidate',
      '/dashboard?view=1',
    );
    expect(assign).toHaveBeenCalledWith('/not-authorized?mode=candidate');
  });

  it('swallows location.assign errors', async () => {
    setUserAgent('Mozilla/5.0 Chrome');
    const assign = setWindow(jest.fn(() => {
      throw new Error('assign failed');
    }));

    const { authRedirect } = await import('@/platform/api-client/authRedirect');

    expect(() => authRedirect(401, 'candidate')?.()).not.toThrow();
    expect(assign).toHaveBeenCalledTimes(1);
  });
});
