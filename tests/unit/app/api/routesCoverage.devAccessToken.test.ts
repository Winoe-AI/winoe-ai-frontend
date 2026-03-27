import { markMetadataCovered } from './coverageHelpers';
import './routesCoverage.testlib';

describe('API Routes Coverage - dev/access-token', () => {
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
    const mod = await import('@/app/api/dev/access-token/route');
    markMetadataCovered('@/app/api/dev/access-token/route');

    const res = await mod.GET();
    expect(res.status).toBe(410);
    expect(await res.json()).toEqual({
      message: 'This endpoint has been disabled.',
    });
  });
});
