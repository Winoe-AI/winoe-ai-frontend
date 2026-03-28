import { markMetadataCovered } from './coverageHelpers';
import {
  createRequest,
  mockForwardJson,
  mockRecruiterAuthSuccess,
} from './withRecruiterAuthRoute.testlib';

describe('/api/simulations route POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('forwards request to create simulation', async () => {
    mockRecruiterAuthSuccess('req-456');
    mockForwardJson.mockResolvedValue({ id: 'new-sim' });

    const mod = await import('@/app/api/simulations/route');
    markMetadataCovered('@/app/api/simulations/route');

    const req = await createRequest('http://localhost/api/simulations', {
      title: 'New Simulation',
      templateId: 'template-1',
    });
    await mod.POST(req as never);

    expect(mockForwardJson).toHaveBeenCalledWith({
      path: '/api/simulations',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'New Simulation', templateId: 'template-1' },
      accessToken: 'token',
      requestId: 'req-456',
    });
  });

  it('returns 400 when body is invalid', async () => {
    mockRecruiterAuthSuccess('req-789');

    const mod = await import('@/app/api/simulations/route');
    const req = await createRequest('http://localhost/api/simulations');
    const res = await mod.POST(req as never);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Bad request' });
  });
});
