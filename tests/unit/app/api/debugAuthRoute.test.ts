import { markMetadataCovered } from './coverageHelpers';
import {
  mockExtractPermissions,
  mockGetSessionNormalized,
  originalNodeEnv,
  resetDebugAuthRouteMocks,
  setNodeEnv,
} from './debugAuthRoute.testlib';

describe('/api/debug/auth route', () => {
  beforeEach(() => {
    resetDebugAuthRouteMocks();
  });

  afterAll(() => {
    setNodeEnv(originalNodeEnv ?? 'test');
  });

  it('returns 404 in production', async () => {
    setNodeEnv('production');
    const mod = await import('@/app/api/debug/auth/route');
    markMetadataCovered('@/app/api/debug/auth/route');

    const res = await mod.GET();
    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    setNodeEnv('test');
    mockGetSessionNormalized.mockResolvedValue(null);

    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authenticated' });
  });

  it('returns debug info when authenticated', async () => {
    setNodeEnv('development');
    const user = {
      sub: 'auth0|123',
      email: 'test@example.com',
      'https://winoe.ai/roles': ['talent_partner'],
    };
    mockGetSessionNormalized.mockResolvedValue({
      user,
      accessToken: 'test-token',
    });
    mockExtractPermissions.mockReturnValue(['read:trials', 'create:invites']);

    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      userKeys: Object.keys(user),
      permissions: ['read:trials', 'create:invites'],
      roles: ['talent_partner'],
    });
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/debug/auth/route');
    markMetadataCovered('@/app/api/debug/auth/route');
    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });
});
