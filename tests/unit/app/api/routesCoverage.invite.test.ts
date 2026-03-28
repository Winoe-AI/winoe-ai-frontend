import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - simulations/[id]/invite', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and POST', async () => {
    const mod = await import('@/app/api/simulations/[id]/invite/route');
    markMetadataCovered('@/app/api/simulations/[id]/invite/route');

    expect(mod.dynamic).toBe('force-dynamic');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(
      NextResponse.json({ inviteId: 'inv-1' }, { status: 201 }),
    );

    const res = await mod.POST(
      new NextRequest('http://localhost/api/simulations/s1/invite', {
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 's1' }) },
    );
    expect(res.status).toBe(201);
  });
});
