import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - submissions/[submissionId]', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and success', async () => {
    const mod = await import('@/app/api/submissions/[submissionId]/route');
    markMetadataCovered('@/app/api/submissions/[submissionId]/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');

    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json({ id: 'sub-1' }));

    const res = await mod.GET(
      new NextRequest('http://localhost/api/submissions/sub-1'),
      { params: Promise.resolve({ submissionId: 'sub-1' }) },
    );
    expect(res.status).toBe(200);
  });
});
