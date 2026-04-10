import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - trials list', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers GET success', async () => {
    const mod = await import('@/app/api/trials/route');
    markMetadataCovered('@/app/api/trials/route');

    expect(mod.dynamic).toBe('force-dynamic');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json([]));

    const res = await mod.GET(new NextRequest('http://localhost/api/trials'));
    expect(res.status).toBe(200);
  });

  it('covers POST success', async () => {
    const mod = await import('@/app/api/trials/route');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(
      NextResponse.json({ id: 'new-sim' }, { status: 201 }),
    );

    const res = await mod.POST(
      new NextRequest('http://localhost/api/trials', { method: 'POST' }),
    );
    expect(res.status).toBe(201);
  });
});
