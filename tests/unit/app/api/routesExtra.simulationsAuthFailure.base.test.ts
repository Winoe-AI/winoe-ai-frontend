import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockRequireBffAuth,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - simulations auth failure base', () => {
  beforeEach(() => {
    resetRoutesExtraMocks();
    mockRequireBffAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ message: 'nope' }, { status: 401 }),
      cookies: [],
    });
  });

  it('GET /api/simulations returns auth failure', async () => {
    const { GET } = await import('@/app/api/simulations/route');
    markMetadataCovered('@/app/api/simulations/route');
    const res = await GET(new NextRequest('http://localhost/api/simulations'));
    expect(res.status).toBe(401);
  });

  it('GET /api/simulations/[id] returns auth failure', async () => {
    const { GET } = await import('@/app/api/simulations/[id]/route');
    markMetadataCovered('@/app/api/simulations/[id]/route');
    const res = await GET(
      new NextRequest('http://localhost/api/simulations/abc 123'),
      {
        params: Promise.resolve({ id: 'abc 123' }),
      },
    );
    expect(res.status).toBe(401);
  });

  it('GET /api/simulations/[id]/candidates returns auth failure', async () => {
    const { GET } = await import('@/app/api/simulations/[id]/candidates/route');
    markMetadataCovered('@/app/api/simulations/[id]/candidates/route');
    const res = await GET(
      new NextRequest('http://localhost/api/simulations/id/candidates'),
      {
        params: Promise.resolve({ id: 'id' }),
      },
    );
    expect(res.status).toBe(401);
  });
});
