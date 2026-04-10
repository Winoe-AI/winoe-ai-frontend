import {
  getAuth0Config,
  importAuth0,
  modeForPathMock,
  resetAuth0TestEnv,
  restoreAuth0TestEnv,
} from './auth0.testlib';

describe('lib/auth0 callback handling', () => {
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

  it('redirects callback errors with sanitized params', async () => {
    await importAuth0();
    const resp = await getAuth0Config().onCallback(
      { code: 'boom', message: 'bad callback' },
      { returnTo: '/dest' },
    );
    expect(resp.status).toBe(307);
    expect(resp.headers.get('location')).toContain('/auth/error?');
  });

  it('redirects to sanitized returnTo on successful callback', async () => {
    await importAuth0();
    const resp = await getAuth0Config().onCallback(null, {
      returnTo: '/foo?bar=baz',
    });
    expect(resp.status).toBe(307);
    expect(resp.headers.get('location')).toContain('/foo');
  });

  it('handles callback errors with name or missing code', async () => {
    await importAuth0();
    const config = getAuth0Config();
    const byName = await config.onCallback(
      { name: 'AuthError', message: 'bad' },
      { returnTo: '/test' },
    );
    const missing = await config.onCallback({}, { returnTo: '/test' });
    expect(byName.headers.get('location')).toContain('errorCode=AuthError');
    expect(missing.headers.get('location')).toContain(
      'errorCode=auth_callback_error',
    );
  });

  it('sanitizes callback error messages', async () => {
    await importAuth0();
    const config = getAuth0Config();
    expect(
      (
        await config.onCallback(
          { code: 'test', message: 'plain string error' },
          { returnTo: '/test' },
        )
      ).status,
    ).toBe(307);
    expect(
      (
        await config.onCallback(
          { code: 'test', message: 'Error at https://evil.com/path?foo=bar' },
          { returnTo: '/test' },
        )
      ).status,
    ).toBe(307);
    expect(
      (
        await config.onCallback(
          { code: 'test', message: '!!@@##$$%%' },
          { returnTo: '/test' },
        )
      ).status,
    ).toBe(307);
  });

  it('supports mode detection for callback return paths', async () => {
    modeForPathMock.mockReturnValueOnce('talent_partner');
    await importAuth0();
    const resp = await getAuth0Config().onCallback(
      { code: 'err' },
      { returnTo: '/dashboard/trials' },
    );
    expect(resp.status).toBe(307);
    expect(resp.headers.get('location')).toContain('mode=talent_partner');
  });
});
