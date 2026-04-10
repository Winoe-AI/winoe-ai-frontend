import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockBffAuthSuccess,
  mockForwardJson,
  resetRouteCoverageMocks,
} from './routesCoverage.testlib';

describe('API Routes Coverage - invite/resend', () => {
  beforeEach(resetRouteCoverageMocks);

  it('covers route metadata and POST', async () => {
    const mod =
      await import('@/app/api/trials/[id]/candidates/[candidateSessionId]/invite/resend/route');
    markMetadataCovered(
      '@/app/api/trials/[id]/candidates/[candidateSessionId]/invite/resend/route',
    );

    expect(mod.dynamic).toBe('force-dynamic');
    mockBffAuthSuccess();
    mockForwardJson.mockResolvedValue(NextResponse.json({ ok: true }));

    const res = await mod.POST(
      new NextRequest(
        'http://localhost/api/trials/s1/candidates/c1/invite/resend',
        { method: 'POST' },
      ),
      { params: Promise.resolve({ id: 's1', candidateSessionId: 'c1' }) },
    );
    expect(res.status).toBe(200);
  });
});
