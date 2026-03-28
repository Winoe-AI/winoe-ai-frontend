import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockRecruiterAuthSuccess,
  mockWithRecruiterAuth,
} from './withRecruiterAuthRoute.testlib';

describe('/api/simulations/[id]/invite route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/simulations/[id]/invite/route');
    markMetadataCovered('@/app/api/simulations/[id]/invite/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withRecruiterAuth and forwards invite request', async () => {
    mockRecruiterAuthSuccess('req-123');
    mockForwardJson.mockResolvedValue({ inviteUrl: 'http://invite-url' });

    const mod = await import('@/app/api/simulations/[id]/invite/route');
    markMetadataCovered('@/app/api/simulations/[id]/invite/route');

    const req = await createRequest(
      'http://localhost/api/simulations/sim-1/invite',
      {
        email: 'test@example.com',
        name: 'Test User',
      },
    );

    await mod.POST(req as never, {
      params: Promise.resolve({ id: 'sim-1' }),
    });

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'invite', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );

    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations/sim-1/invite',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@example.com', name: 'Test User' },
      accessToken: 'token',
      requestId: 'req-123',
    });
  });
});
