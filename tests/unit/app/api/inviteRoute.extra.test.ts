import {
  createRequest,
  mockForwardJson,
  mockTalentPartnerAuthSuccess,
} from './withTalentPartnerAuthRoute.testlib';

describe('/api/trials/[id]/invite route extra cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses empty object when request body is missing', async () => {
    mockTalentPartnerAuthSuccess('req-456');
    mockForwardJson.mockResolvedValue({});

    const mod = await import('@/app/api/trials/[id]/invite/route');
    const req = await createRequest(
      'http://localhost/api/trials/trial-2/invite',
    );
    await mod.POST(req as never, {
      params: Promise.resolve({ id: 'trial-2' }),
    });

    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ body: {} }),
    );
  });

  it('encodes trial id in upstream path', async () => {
    mockTalentPartnerAuthSuccess('req-789');
    mockForwardJson.mockResolvedValue({});

    const mod = await import('@/app/api/trials/[id]/invite/route');
    const req = await createRequest(
      'http://localhost/api/trials/sim%2F1/invite',
      {},
    );
    await mod.POST(req as never, { params: Promise.resolve({ id: 'sim/1' }) });

    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/trials/sim%2F1/invite' }),
    );
  });
});
