import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - trials/[id]/candidates', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and success', async () => {
    const mod = await import('@/app/api/trials/[id]/candidates/route');
    markMetadataCovered('@/app/api/trials/[id]/candidates/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json([]));

    const res = await mod.GET(
      new NextRequest('http://localhost/api/trials/s1/candidates'),
      { params: Promise.resolve({ id: 's1' }) },
    );
    expect(res.status).toBe(200);
  });
});
