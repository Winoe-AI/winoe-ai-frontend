import { terminateSimulation } from '@/features/recruiter/api/simulationLifecycleApi';

const mockRequestRecruiterBff = jest.fn();

jest.mock('@/features/recruiter/api/requestRecruiterBffApi', () => ({
  requestRecruiterBff: (...args: unknown[]) => mockRequestRecruiterBff(...args),
}));

describe('simulationLifecycle terminateSimulation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('posts to terminate endpoint and returns cleanup IDs', async () => {
    mockRequestRecruiterBff.mockResolvedValueOnce({
      data: {
        simulationId: 42,
        status: 'terminated',
        cleanupJobIds: ['job-1', 'job-2'],
      },
    });

    const result = await terminateSimulation('sim-1');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      simulationId: '42',
      status: 'terminated',
      cleanupJobIds: ['job-1', 'job-2'],
    });
    expect(mockRequestRecruiterBff).toHaveBeenCalledWith(
      '/simulations/sim-1/terminate',
      {
        method: 'POST',
        body: { confirm: true },
      },
    );
  });

  it('returns ok:false when status is missing from success payload', async () => {
    mockRequestRecruiterBff.mockResolvedValueOnce({
      data: { simulationId: 42, cleanupJobIds: ['job-1'] },
    });

    const result = await terminateSimulation('sim-1');
    expect(result.ok).toBe(false);
    expect(result.message).toBe('Unable to terminate simulation.');
    expect(result.data).toEqual({
      simulationId: '42',
      status: 'unknown',
      cleanupJobIds: ['job-1'],
    });
  });

  it('treats idempotent conflict with terminated payload as success', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce({
      status: 409,
      details: {
        simulationId: 'sim-1',
        status: 'terminated',
        cleanupJobIds: ['cleanup-1'],
      },
    });

    const result = await terminateSimulation('sim-1');
    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({
      simulationId: 'sim-1',
      status: 'terminated',
      cleanupJobIds: ['cleanup-1'],
    });
  });

  it('returns ok:false for 409 payload without terminated status', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce({
      status: 409,
      details: { simulationId: 'sim-1', cleanupJobIds: ['cleanup-1'] },
    });

    const result = await terminateSimulation('sim-1');
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.message).toBe('Unable to terminate simulation.');
  });
});
