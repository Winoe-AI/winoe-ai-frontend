import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockRecruiterAuthSuccess,
  mockWithRecruiterAuth,
} from './withRecruiterAuthRoute.testlib';

describe('/api/simulations route metadata + GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/simulations/route');
    markMetadataCovered('@/app/api/simulations/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('forwards request to list simulations', async () => {
    mockRecruiterAuthSuccess('req-123');
    mockForwardJson.mockResolvedValue({ simulations: [] });

    const mod = await import('@/app/api/simulations/route');
    markMetadataCovered('@/app/api/simulations/route');

    const req = await createRequest('http://localhost/api/simulations');
    await mod.GET(req as never);

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'simulations-list', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations',
      accessToken: 'token',
      requestId: 'req-123',
    });
  });
});
