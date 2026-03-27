import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - submissions', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and path building', async () => {
    const mod = await import('@/app/api/submissions/route');
    markMetadataCovered('@/app/api/submissions/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json([]));

    let res = await mod.GET(new NextRequest('http://localhost/api/submissions'));
    expect(res.status).toBe(200);

    res = await mod.GET(
      new NextRequest('http://localhost/api/submissions?sim=1&status=active'),
    );
    expect(res.status).toBe(200);
    expect(mockForwardJson).toHaveBeenLastCalledWith(
      expect.objectContaining({ path: '/api/submissions?sim=1&status=active' }),
    );
  });
});
