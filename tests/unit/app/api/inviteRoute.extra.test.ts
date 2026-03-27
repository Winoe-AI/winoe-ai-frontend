import {
  createRequest,
  mockForwardJson,
  mockRecruiterAuthSuccess,
} from './withRecruiterAuthRoute.testlib';

describe('/api/simulations/[id]/invite route extra cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('uses empty object when request body is missing', async () => {
    mockRecruiterAuthSuccess('req-456');
    mockForwardJson.mockResolvedValue({});

    const mod = await import('@/app/api/simulations/[id]/invite/route');
    const req = await createRequest(
      'http://localhost/api/simulations/sim-2/invite',
    );
    await mod.POST(req as never, { params: Promise.resolve({ id: 'sim-2' }) });

    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ body: {} }),
    );
  });

  it('encodes simulation id in upstream path', async () => {
    mockRecruiterAuthSuccess('req-789');
    mockForwardJson.mockResolvedValue({});

    const mod = await import('@/app/api/simulations/[id]/invite/route');
    const req = await createRequest(
      'http://localhost/api/simulations/sim%2F1/invite',
      {},
    );
    await mod.POST(req as never, { params: Promise.resolve({ id: 'sim/1' }) });

    expect(mockForwardJson).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/simulations/sim%2F1/invite' }),
    );
  });
});
