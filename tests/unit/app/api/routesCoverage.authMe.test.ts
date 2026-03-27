import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - auth/me', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and success path', async () => {
    const mod = await import('@/app/api/auth/me/route');
    markMetadataCovered('@/app/api/auth/me/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json({ id: 1 }));

    const res = await mod.GET(new NextRequest('http://localhost/api/auth/me'));
    expect(res.status).toBe(200);
  });
});
