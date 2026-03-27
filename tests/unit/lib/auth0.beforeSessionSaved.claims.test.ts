import { getAuth0Config, importAuth0, resetAuth0TestEnv, restoreAuth0TestEnv } from './auth0.testlib';

describe('lib/auth0 beforeSessionSaved claim precedence', () => {
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

  it('filters non-string values from permission arrays', async () => {
    await importAuth0();
    const result = await getAuth0Config().beforeSessionSaved({ user: { permissions: ['valid', 123, null, 'another', undefined] } }, 'x.e30.y');
    expect(result.user.permissions).toEqual(['valid', 'another']);
  });

  it('parses comma/space separated permissions strings', async () => {
    await importAuth0();
    const payload = Buffer.from(JSON.stringify({ 'https://tenon.ai/permissions_str': 'perm1, perm2,perm3  perm4' })).toString('base64url');
    const result = await getAuth0Config().beforeSessionSaved({ user: {} }, `x.${payload}.y`);
    expect(result.user.permissions).toEqual(expect.arrayContaining(['perm1', 'perm2', 'perm3', 'perm4']));
  });

  it('derives recruiter and candidate permissions from role claims', async () => {
    await importAuth0();
    const payload = Buffer.from(JSON.stringify({ roles: ['SuperRecruiter', 'CandidateAdmin'] })).toString('base64url');
    const result = await getAuth0Config().beforeSessionSaved({ user: {} }, `x.${payload}.y`);
    expect(result.user.permissions).toEqual(expect.arrayContaining(['recruiter:access', 'candidate:access']));
  });

  it('prefers user permissions and roles over token claims', async () => {
    await importAuth0();
    const config = getAuth0Config();

    const pPayload = Buffer.from(JSON.stringify({ permissions: ['token:perm'] })).toString('base64url');
    const pRes = await config.beforeSessionSaved({ user: { permissions: ['user:perm'] } }, `x.${pPayload}.y`);
    expect(pRes.user.permissions).toContain('user:perm');
    expect(pRes.user.permissions).not.toContain('token:perm');

    const rPayload = Buffer.from(JSON.stringify({ roles: ['TokenRole'] })).toString('base64url');
    const rRes = await config.beforeSessionSaved({ user: { 'https://tenon.ai/roles': ['UserRole'] } }, `x.${rPayload}.y`);
    expect(rRes.user.roles).toContain('UserRole');
    expect(rRes.user.roles).not.toContain('TokenRole');
  });

  it('preserves existing user permissions and roles when normalization is empty', async () => {
    await importAuth0();
    const result = await getAuth0Config().beforeSessionSaved({ user: { permissions: ['existing:perm'], roles: ['ExistingRole'] } }, 'x.e30.y');
    expect(result.user.permissions).toContain('existing:perm');
  });
});
