import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockTalentPartnerAuthSuccess,
  mockWithTalentPartnerAuth,
} from './withTalentPartnerAuthRoute.testlib';

describe('/api/trials/[id]/invite route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('covers metadata exports', async () => {
    const mod = await import('@/app/api/trials/[id]/invite/route');
    markMetadataCovered('@/app/api/trials/[id]/invite/route');

    expect(mod.dynamic).toBe('force-dynamic');
    expect(mod.runtime).toBe('nodejs');
    expect(mod.revalidate).toBe(0);
    expect(mod.fetchCache).toBe('force-no-store');
  });

  it('calls withTalentPartnerAuth and forwards invite request', async () => {
    mockTalentPartnerAuthSuccess('req-123');
    mockForwardJson.mockResolvedValue({ inviteUrl: 'http://invite-url' });

    const mod = await import('@/app/api/trials/[id]/invite/route');
    markMetadataCovered('@/app/api/trials/[id]/invite/route');

    const req = await createRequest(
      'http://localhost/api/trials/trial-1/invite',
      {
        email: 'test@example.com',
        name: 'Test User',
      },
    );

    await mod.POST(req as never, {
      params: Promise.resolve({ id: 'trial-1' }),
    });

    expect(mockWithTalentPartnerAuth).toHaveBeenCalledWith(
      req,
      { tag: 'invite', requirePermission: 'talent_partner:access' },
      expect.any(Function),
    );

    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/trials/trial-1/invite',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test@example.com', name: 'Test User' },
      accessToken: 'token',
      requestId: 'req-123',
      timeoutMs: 90_000,
    });
  });
});
