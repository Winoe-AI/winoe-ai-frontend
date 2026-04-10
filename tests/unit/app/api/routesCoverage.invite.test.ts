import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - trials/[id]/invite', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and POST', async () => {
    const mod = await import('@/app/api/trials/[id]/invite/route');
    markMetadataCovered('@/app/api/trials/[id]/invite/route');

    expect(mod.dynamic).toBe('force-dynamic');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(
      NextResponse.json({ inviteId: 'inv-1' }, { status: 201 }),
    );

    const res = await mod.POST(
      new NextRequest('http://localhost/api/trials/s1/invite', {
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 's1' }) },
    );
    expect(res.status).toBe(201);
  });
});
