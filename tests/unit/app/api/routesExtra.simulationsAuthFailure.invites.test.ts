import { markMetadataCovered } from './coverageHelpers';
import {
  NextRequest,
  NextResponse,
  mockRequireBffAuth,
  resetRoutesExtraMocks,
} from './routesExtra.testlib';

describe('API routes extra coverage - simulations auth failure invites', () => {
  beforeEach(() => {
    resetRoutesExtraMocks();
    mockRequireBffAuth.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ message: 'nope' }, { status: 401 }),
      cookies: [],
    });
  });

  it('POST invite returns auth failure', async () => {
    const { POST } = await import('@/app/api/simulations/[id]/invite/route');
    markMetadataCovered('@/app/api/simulations/[id]/invite/route');
    const res = await POST(
      new NextRequest('http://localhost/api/simulations/id/invite'),
      {
        params: Promise.resolve({ id: 'id' }),
      },
    );
    expect(res.status).toBe(401);
  });

  it('POST resend invite returns auth failure', async () => {
    const routePath =
      '@/app/api/simulations/[id]/candidates/[candidateSessionId]/invite/resend/route';
    const { POST } = await import(routePath);
    markMetadataCovered(routePath);
    const res = await POST(
      new NextRequest(
        'http://localhost/api/simulations/id/candidates/one/invite/resend',
      ),
      { params: Promise.resolve({ id: 'id', candidateSessionId: 'one' }) },
    );
    expect(res.status).toBe(401);
  });
});
