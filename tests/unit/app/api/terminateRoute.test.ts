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
    method = 'POST';
    private readonly _body: unknown;
    private readonly _throwOnJson: boolean;
    constructor(url: string, init?: { body?: unknown; throwOnJson?: boolean }) {
      this.url = url;
      this.nextUrl = new URL(url);
      this.headers = { get: () => null };
      this._body = init?.body;
      this._throwOnJson = init?.throwOnJson ?? false;
    }
    async json() {
      if (this._throwOnJson) throw new Error('invalid json');
      return this._body;
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

const withAuth = (requestId: string) =>
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
  const mod = await import('@/app/api/simulations/[id]/terminate/route');
  markMetadataCovered('@/app/api/simulations/[id]/terminate/route');
  return mod;
}

describe('/api/simulations/[id]/terminate route', () => {
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

  it('calls withRecruiterAuth and forwards terminate request body', async () => {
    withAuth('req-123');
    mockForwardJson.mockResolvedValue({
      simulationId: 1,
      status: 'terminated',
    });
    const mod = await loadRoute();
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim-1/terminate',
      { body: { confirm: true } },
    );

    await mod.POST(req as never, { params: Promise.resolve({ id: 'sim-1' }) });

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'terminate', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/terminate',
      method: 'POST',
      cache: 'no-store',
      body: { confirm: true },
      accessToken: 'token',
      requestId: 'req-123',
    });
  });

  it('forwards terminate request without body when req.json fails', async () => {
    withAuth('req-456');
    mockForwardJson.mockResolvedValue({
      simulationId: 1,
      status: 'terminated',
    });
    const mod = await loadRoute();
    const { NextRequest } = await import('next/server');
    const req = new NextRequest(
      'http://localhost/api/simulations/sim-1/terminate',
      { throwOnJson: true },
    );

    await mod.POST(req as never, { params: Promise.resolve({ id: 'sim-1' }) });
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/terminate',
      method: 'POST',
      cache: 'no-store',
      accessToken: 'token',
      requestId: 'req-456',
    });
  });
});
