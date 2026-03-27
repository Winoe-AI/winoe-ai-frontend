import { getAuth0Config, importAuth0, resetAuth0TestEnv, restoreAuth0TestEnv } from './auth0.testlib';

describe('lib/auth0 env fallback behavior', () => {
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

  it('falls back to stub auth when required env vars are missing', async () => {
    delete process.env.TENON_AUTH0_SECRET;
    const { auth0, getAccessToken } = await importAuth0();
    await expect(auth0.middleware()).resolves.toBeDefined();
    await expect(getAccessToken()).rejects.toThrow(/Auth0 env vars are missing/);
  });

  it('uses resolved base URL for successful callback redirect paths', async () => {
    await importAuth0();
    const resp = await getAuth0Config().onCallback(null, { returnTo: '/dashboard' });
    expect(resp.status).toBe(307);
    expect(resp.headers.get('location')).toContain('/dashboard');
  });
});
