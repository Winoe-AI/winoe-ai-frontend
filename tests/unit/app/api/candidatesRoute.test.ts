import { markMetadataCovered } from './coverageHelpers';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
      headers: { get: () => null, set: () => {} },
      cookies: { set: () => {}, getAll: () => [] },
      json: async () => body,
    }),
  },
  NextRequest: class {
    url: string;
    nextUrl: URL;
    headers: { get: () => null };
    method = 'GET';
    constructor(url: string) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.headers = { get: () => null };
    }
  },
}));

const mockForwardJson = jest.fn();
const mockWithRecruiterAuth = jest.fn();
jest.mock('@/platform/server/bff', () => ({
  forwardJson: (...args: unknown[]) => mockForwardJson(...args),
}));
jest.mock('@/app/api/bffRouteHelpers', () => ({
  withRecruiterAuth: (...args: unknown[]) => mockWithRecruiterAuth(...args),
}));

const withAuth = (requestId = 'req-123') =>
  mockWithRecruiterAuth.mockImplementation(
    async (
      _req: unknown,
      _opts: unknown,
      handler: (auth: {
        accessToken: string;
        requestId: string;
      }) => Promise<unknown>,
    ) => handler({ accessToken: 'token', requestId }),
  );

async function loadRoute() {
  const mod = await import('@/app/api/simulations/[id]/candidates/route');
  markMetadataCovered('@/app/api/simulations/[id]/candidates/route');
  return mod;
}

describe('/api/simulations/[id]/candidates route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await loadRoute();
    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withRecruiterAuth and forwards candidates request', async () => {
    withAuth('req-123');
    mockForwardJson.mockResolvedValue({ candidates: [] });
    const mod = await loadRoute();
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim-1/candidates',
    );

    await mod.GET(req as never, { params: Promise.resolve({ id: 'sim-1' }) });

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'simulations-candidates', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/candidates',
      accessToken: 'token',
      requestId: 'req-123',
    });
  });

  it('encodes simulation id in path', async () => {
    withAuth('req-456');
    mockForwardJson.mockResolvedValue({ candidates: [] });
    const mod = await loadRoute();
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim%2F1/candidates',
    );

    await mod.GET(req as never, { params: Promise.resolve({ id: 'sim/1' }) });
    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/simulations/sim%2F1/candidates' }),
    );
  });
});
