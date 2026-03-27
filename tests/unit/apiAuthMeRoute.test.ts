import { markMetadataCovered } from './app/api/coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockRecruiterAuthSuccess,
  mockWithRecruiterAuth,
} from './app/api/withRecruiterAuthRoute.testlib';

describe('/api/auth/me route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/auth/me/route');
    markMetadataCovered('@/app/api/auth/me/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withRecruiterAuth and forwards to backend', async () => {
    mockRecruiterAuthSuccess('req-123', 'tok');
    mockForwardJson.mockResolvedValue({ id: 1, name: 'Recruiter' });

    const mod = await import('@/app/api/auth/me/route');
    const req = await createRequest('http://localhost/api/auth/me');
    await mod.GET(req as never);

    expect(mockWithRecruiterAuth).toHaveBeenCalledWith(
      req,
      { tag: 'auth-me', requirePermission: 'recruiter:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/auth/me',
      accessToken: 'tok',
      requestId: 'req-123',
    });
  });
});
