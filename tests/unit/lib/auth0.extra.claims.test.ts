import {
  Auth0ClientMock,
  resetAuth0ExtraMocks,
  restoreAuth0ExtraEnv,
} from './auth0.extra.testlib';

describe('lib/auth0 extra coverage (claims)', () => {
  beforeEach(() => {
    resetAuth0ExtraMocks();
  });

  afterAll(() => {
    restoreAuth0ExtraEnv();
  });

  it('handles token object accessToken and permission-string parsing', async () => {
    await import('@/platform/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];

    const nestedPerms = Buffer.from(
      JSON.stringify({ permissions: ['nested:perm'] }),
    ).toString('base64url');
    const fromObject = await config.beforeSessionSaved(
      { user: {}, accessToken: { accessToken: `header.${nestedPerms}.sig` } },
      'invalid',
    );
    expect(fromObject.user.permissions).toContain('nested:perm');

    const permsStr = Buffer.from(
      JSON.stringify({
        'https://winoe.ai/permissions_str': '  a , b   c,d,,e  ',
      }),
    ).toString('base64url');
    const parsed = await config.beforeSessionSaved(
      { user: {} },
      `x.${permsStr}.y`,
    );
    expect(parsed.user.permissions).toEqual(
      expect.arrayContaining(['a', 'b', 'c', 'd', 'e']),
    );
  });

  it('derives talent_partner and candidate permissions from combined role text', async () => {
    await import('@/platform/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];
    const payload = Buffer.from(
      JSON.stringify({ roles: ['TalentPartnerCandidate'] }),
    ).toString('base64url');
    const result = await config.beforeSessionSaved(
      { user: {} },
      `x.${payload}.y`,
    );
    expect(result.user.permissions).toContain('talent_partner:access');
    expect(result.user.permissions).toContain('candidate:access');
  });

  it('preserves existing custom claim permissions and role claims', async () => {
    await import('@/platform/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];

    const existing = await config.beforeSessionSaved(
      {
        user: {
          'https://winoe.ai/permissions': ['existing:custom'],
          permissions: [],
        },
      },
      'x.e30.y',
    );
    expect(existing.user.permissions).toContain('existing:custom');
    expect(existing.user['https://winoe.ai/permissions']).toContain(
      'existing:custom',
    );

    const rolePayload = Buffer.from(
      JSON.stringify({ roles: ['TokenRole'] }),
    ).toString('base64url');
    const mergedRoles = await config.beforeSessionSaved(
      { user: {} },
      `x.${rolePayload}.y`,
    );
    expect(mergedRoles.user['https://winoe.ai/roles']).toContain('TokenRole');
  });

  it('keeps empty permissions array when no permissions are present', async () => {
    await import('@/platform/auth0');
    const config = Auth0ClientMock.mock.calls[0][0];
    const payload = Buffer.from(JSON.stringify({})).toString('base64url');
    const result = await config.beforeSessionSaved(
      { user: { permissions: [] } },
      `x.${payload}.y`,
    );
    expect(result.user.permissions).toEqual([]);
  });
});
