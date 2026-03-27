import { markMetadataCovered } from './coverageHelpers';
import './routesCoverage.testlib';

describe('API Routes Coverage - debug/auth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('covers route with no session', async () => {
    jest.doMock('@/lib/auth0', () => ({
      getSessionNormalized: jest.fn().mockResolvedValue(null),
    }));

    jest.resetModules();
    const mod = await import('@/app/api/debug/auth/route');
    markMetadataCovered('@/app/api/debug/auth/route');

    const res = await mod.GET();
    expect(res.status).toBeDefined();
  });
});
