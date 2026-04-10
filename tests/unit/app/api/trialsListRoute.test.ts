import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockTalentPartnerAuthSuccess,
  mockWithTalentPartnerAuth,
} from './withTalentPartnerAuthRoute.testlib';

describe('/api/trials route metadata + GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/trials/route');
    markMetadataCovered('@/app/api/trials/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('forwards request to list trials', async () => {
    mockTalentPartnerAuthSuccess('req-123');
    mockForwardJson.mockResolvedValue({ trials: [] });

    const mod = await import('@/app/api/trials/route');
    markMetadataCovered('@/app/api/trials/route');

    const req = await createRequest('http://localhost/api/trials');
    await mod.GET(req as never);

    expect(mockWithTalentPartnerAuth).toHaveBeenCalledWith(
      req,
      { tag: 'trials-list', requirePermission: 'talent_partner:access' },
      expect.any(Function),
    );
    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/trials',
      accessToken: 'token',
      requestId: 'req-123',
    });
  });
});
