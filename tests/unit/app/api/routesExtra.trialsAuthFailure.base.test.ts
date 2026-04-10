import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockRequireBffAuth,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - trials auth failure base', () => {
  beforeEach(() => {
    resetRoutesExtraMocks();
    mockRequireBffAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ message: 'nope' }, { status: 401 }),
      cookies: [],
    });
  });

  it('GET /api/trials returns auth failure', async () => {
    const { GET } = await import('@/app/api/trials/route');
    markMetadataCovered('@/app/api/trials/route');
    const res = await GET(new NextRequest('http://localhost/api/trials'));
    expect(res.status).toBe(401);
  });

  it('GET /api/trials/[id] returns auth failure', async () => {
    const { GET } = await import('@/app/api/trials/[id]/route');
    markMetadataCovered('@/app/api/trials/[id]/route');
    const res = await GET(
      new NextRequest('http://localhost/api/trials/abc 123'),
      {
        params: Promise.resolve({ id: 'abc 123' }),
      },
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/trials/[id]/candidates returns auth failure', async () => {
    const { GET } = await import('@/app/api/trials/[id]/candidates/route');
    markMetadataCovered('@/app/api/trials/[id]/candidates/route');
    const res = await GET(
      new NextRequest('http://localhost/api/trials/id/candidates'),
      {
        params: Promise.resolve({ id: 'id' }),
      },
    );
    expect(res.status).toBe(401);
  });
});
