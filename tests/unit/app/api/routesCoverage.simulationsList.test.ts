import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - simulations list', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers GET success', async () => {
    const mod = await import('@/app/api/simulations/route');
    markMetadataCovered('@/app/api/simulations/route');

    expect(mod.dynamic).toBe('force-dynamic');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json([]));

    const res = await mod.GET(
      new NextRequest('http://localhost/api/simulations'),
    );
    expect(res.status).toBe(200);
  });

  it('covers POST success', async () => {
    const mod = await import('@/app/api/simulations/route');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(
      NextResponse.json({ id: 'new-sim' }, { status: 201 }),
    );

    const res = await mod.POST(
      new NextRequest('http://localhost/api/simulations', { method: 'POST' }),
    );
    expect(res.status).toBe(201);
  });
});
