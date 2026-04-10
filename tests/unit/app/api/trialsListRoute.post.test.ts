import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockTalentPartnerAuthSuccess,
} from './withTalentPartnerAuthRoute.testlib';

describe('/api/trials route POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('forwards request to create trial', async () => {
    mockTalentPartnerAuthSuccess('req-456');
    mockForwardJson.mockResolvedValue({ id: 'new-sim' });

    const mod = await import('@/app/api/trials/route');
    markMetadataCovered('@/app/api/trials/route');

    const req = await createRequest('http://localhost/api/trials', {
      title: 'New Trial',
      templateId: 'template-1',
    });
    await mod.POST(req as never);

    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/trials',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'New Trial', templateId: 'template-1' },
      accessToken: 'token',
      requestId: 'req-456',
    });
  });

  it('returns 400 when body is invalid', async () => {
    mockTalentPartnerAuthSuccess('req-789');

    const mod = await import('@/app/api/trials/route');
    const req = await createRequest('http://localhost/api/trials');
    const res = await mod.POST(req as never);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Bad request' });
  });
});
