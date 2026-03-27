import {
  markMetadataCovered,
  resetRoutesBasicMocks,
} from './routesBasic.testlib';

describe('debug/auth route', () => {
  let getSessionMock: jest.Mock;

  beforeEach(() => {
    ({ getSessionMock } = resetRoutesBasicMocks());
  });

  afterAll(() => {
    markMetadataCovered('@/app/api/debug/auth/route.ts');
  });

  it('returns 404 in production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(404);
    process.env.NODE_ENV = previous;
  });

  it('returns 401 when not authenticated', async () => {
    getSessionMock.mockResolvedValue(null);
    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(401);
  });

  it('returns permissions payload when authenticated', async () => {
    getSessionMock.mockResolvedValue({
      user: { email: 'a@test.com' },
      accessToken: 'tok',
    });
    const mod = await import('@/app/api/debug/auth/route');
    const res = await mod.GET();
    expect(res.status).toBe(200);
  });
});
