import { markMetadataCovered } from './coverageHelpers';
import './routesCoverage.testlib';

describe('API Routes Coverage - health', () => {
  beforeEach(() => jest.clearAllMocks());

  it('covers route metadata', async () => {
    const mod = await import('@/app/api/health/route');
    markMetadataCovered('@/app/api/health/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });
});
