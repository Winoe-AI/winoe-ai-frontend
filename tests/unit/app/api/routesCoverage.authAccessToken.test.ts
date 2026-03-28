import { markMetadataCovered } from './coverageHelpers';
import './routesCoverage.testlib';

describe('API Routes Coverage - auth/access-token', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  it('covers local disabled path', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.VERCEL_ENV;
    const mod = await import('@/app/api/auth/access-token/route');
    markMetadataCovered('@/app/api/auth/access-token/route');

    const res = await mod.GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });

  it('covers non-local not-found path', async () => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import('@/app/api/auth/access-token/route');

    const res = await mod.GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: 'Not found' });
  });
});
