import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - trials/[id]', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and id parameter', async () => {
    const mod = await import('@/app/api/trials/[id]/route');
    markMetadataCovered('@/app/api/trials/[id]/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json({ id: 'trial-1' }));

    const res = await mod.GET(
      new NextRequest('http://localhost/api/trials/trial-1'),
      { params: Promise.resolve({ id: 'trial-1' }) },
    );
    expect(res.status).toBe(200);
    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/trials/trial-1' }),
    );
  });

  it('encodes special characters in id', async () => {
    const mod = await import('@/app/api/trials/[id]/route');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json({}));

    await mod.GET(
      new NextRequest('http://localhost/api/trials/sim%20with%20spaces'),
      { params: Promise.resolve({ id: 'sim with spaces' }) },
    );
    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/trials/sim%20with%20spaces' }),
    );
  });
});
