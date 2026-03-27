import {
  mockExtractPermissions,
  mockGetSessionNormalized,
  resetDebugAuthRouteMocks,
  setNodeEnv,
} from './debugAuthRoute.testlib';

describe('/api/debug/auth route edge cases', () => {
  beforeEach(() => {
    resetDebugAuthRouteMocks();
    setNodeEnv('test');
  });

  it('handles roles under plain "roles" field', async () => {
    const user = { sub: 'auth0|123', roles: ['admin'] };
    mockGetSessionNormalized.mockResolvedValue({ user });
    mockExtractPermissions.mockReturnValue([]);

    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual(['admin']);
  });

  it('passes null token when session has no accessToken', async () => {
    const user = { sub: 'auth0|456' };
    mockGetSessionNormalized.mockResolvedValue({ user });
    mockExtractPermissions.mockReturnValue([]);

    const mod = await import('@/app/api/debug/auth/route');
    await mod.GET();
    expect(mockExtractPermissions).toHaveBeenCalledWith(user, null);
  });

  it('returns empty user keys and roles for sessions without user', async () => {
    mockGetSessionNormalized.mockResolvedValue({});
    mockExtractPermissions.mockReturnValue([]);

    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    expect(res.body.userKeys).toEqual([]);
    expect(res.body.roles).toEqual([]);
  });
});
