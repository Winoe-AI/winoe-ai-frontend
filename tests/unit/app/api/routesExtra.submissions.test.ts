import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockForwardJson,
  mockRequireBffAuth,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - submissions', () => {
  afterEach(resetRoutesExtraMocks);

  it('builds path without search params', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: true,
      accessToken: 'tok-sub',
      cookies: [],
    });
    mockForwardJson.mockResolvedValue(NextResponse.json({ items: [] }));

    const { GET } = await import('@/app/api/submissions/route');
    markMetadataCovered('@/app/api/submissions/route');
    const res = await GET(new NextRequest('http://localhost/api/submissions'));
    expect(res.status).toBe(200);
    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/submissions' }),
    );
  });

  it('returns auth failure for submission detail', async () => {
    mockRequireBffAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ message: 'forbidden' }, { status: 403 }),
      cookies: [],
    });
    const { GET } = await import('@/app/api/submissions/[submissionId]/route');
    markMetadataCovered('@/app/api/submissions/[submissionId]/route');
    const res = await GET(
      new NextRequest('http://localhost/api/submissions/99'),
      {
        params: Promise.resolve({ submissionId: '99' }),
      },
    );
    expect(res.status).toBe(403);
  });
});
