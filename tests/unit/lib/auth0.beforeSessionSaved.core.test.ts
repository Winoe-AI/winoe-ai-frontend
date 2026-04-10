import {
  getAuth0Config,
  importAuth0,
  resetAuth0TestEnv,
  restoreAuth0TestEnv,
} from './auth0.testlib';

describe('lib/auth0 beforeSessionSaved core token handling', () => {
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

  it('adds permissions and roles from token payload', async () => {
    await importAuth0();
    const payload = Buffer.from(
      JSON.stringify({ permissions: ['token:perm'], roles: ['TalentPartner'] }),
    ).toString('base64url');
    const result = await getAuth0Config().beforeSessionSaved(
      { user: { permissions: [] } },
      `x.${payload}.y`,
    );
    expect(result.user.permissions).toContain('token:perm');
    expect(result.user.roles).toContain('TalentPartner');
  });

  it('derives role permissions when explicit permissions are empty', async () => {
    await importAuth0();
    const payload = Buffer.from(JSON.stringify({ permissions: [] })).toString(
      'base64url',
    );
    const result = await getAuth0Config().beforeSessionSaved(
      { user: { roles: ['Candidate'] } },
      `x.${payload}.y`,
    );
    expect(result.user.permissions).toContain('candidate:access');
  });

  it('handles malformed jwt payloads gracefully', async () => {
    await importAuth0();
    const result = await getAuth0Config().beforeSessionSaved(
      { user: { permissions: [] } },
      'not-a-token',
    );
    expect(result.user.permissions).toEqual([]);
  });

  it('supports accessToken variants and id-token fallback', async () => {
    await importAuth0();
    const config = getAuth0Config();
    expect(
      (
        await config.beforeSessionSaved(
          { user: {}, accessToken: 'direct-token' },
          'x.e30.y',
        )
      ).user,
    ).toBeDefined();
    expect(
      (
        await config.beforeSessionSaved(
          { user: {}, accessToken: { token: 'nested-token' } },
          'invalid',
        )
      ).user,
    ).toBeDefined();
    expect(
      (
        await config.beforeSessionSaved(
          { user: {}, accessToken: { accessToken: 'nested-access-token' } },
          'invalid',
        )
      ).user,
    ).toBeDefined();

    const idPayload = Buffer.from(
      JSON.stringify({ permissions: ['id:perm'] }),
    ).toString('base64url');
    const fallback = await config.beforeSessionSaved(
      { user: {}, accessToken: 'invalid' },
      `x.${idPayload}.y`,
    );
    expect(fallback.user.permissions).toContain('id:perm');
  });

  it('decodes JWT via Buffer when atob is unavailable', async () => {
    const originalAtob = global.atob;
    // @ts-expect-error removing atob for branch coverage
    delete global.atob;
    await importAuth0();
    const payload = Buffer.from(
      JSON.stringify({ permissions: ['buffer:perm'] }),
    ).toString('base64url');
    const result = await getAuth0Config().beforeSessionSaved(
      { user: {} },
      `x.${payload}.y`,
    );
    expect(result.user.permissions).toContain('buffer:perm');
    global.atob = originalAtob;
  });
});
