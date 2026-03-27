import { markMetadataCovered } from './coverageHelpers';
import './routesExtra.testlib';

describe('API routes extra coverage - dev access-token route', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
      return;
    }
    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it('returns 404 outside local', async () => {
    process.env.VERCEL_ENV = 'preview';
    const mod = await import('@/app/api/dev/access-token/route');
    markMetadataCovered('@/app/api/dev/access-token/route');

    const result = await mod.GET();
    expect(result.status).toBe(404);
  });
});
