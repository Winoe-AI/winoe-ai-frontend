import {
  extractPermissions,
  getUserEmail,
  normalizeUserClaims,
} from '@/platform/auth0/claims';

const makeToken = (claims: Record<string, unknown>) => {
  const header = Buffer.from('{}').toString('base64url');
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${header}.${payload}.sig`;
};

describe('auth0-claims extras', () => {
  it('prefers existing user permissions over namespaced replacements', () => {
    const claims = normalizeUserClaims({
      permissions: ['keep'],
      'https://winoe.dev/perms': ['ns'],
    });
    expect(claims.permissions).toEqual(['keep']);
  });

  it('extracts permissions from token when user lacks them and maps token roles', () => {
    const token = makeToken({ permissions: ['tok'], roles: ['TalentPartner'] });
    expect(extractPermissions({}, token)).toEqual(
      expect.arrayContaining(['tok', 'talent_partner:access']),
    );
  });

  it('returns null email when neither namespaced nor email present', () => {
    expect(getUserEmail({})).toBeNull();
  });
});
