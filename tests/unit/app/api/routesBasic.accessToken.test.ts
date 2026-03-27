import {
  markMetadataCovered,
  resetRoutesBasicMocks,
} from './routesBasic.testlib';

describe('app/api auth token routes', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    resetRoutesBasicMocks();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  afterAll(() => {
    markMetadataCovered('@/app/api/auth/access-token/route.ts');
    markMetadataCovered('@/app/api/dev/access-token/route.ts');
  });

  it('returns 410 in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('@/app/api/auth/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(410);
  });

  it('returns 404 outside local', async () => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import('@/app/api/auth/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(404);
  });

  it('returns 410 for dev route in local development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('@/app/api/dev/access-token/route');
    const res = await mod.GET();
    expect(res.status).toBe(410);
  });
});
