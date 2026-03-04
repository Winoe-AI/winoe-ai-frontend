import {
  activateSimulationInviting,
  regenerateSimulationScenario,
  retrySimulationGeneration,
  terminateSimulation,
} from '@/features/recruiter/api/simulationLifecycle';

const mockRequestRecruiterBff = jest.fn();

jest.mock('@/features/recruiter/api/requestRecruiterBff', () => ({
  requestRecruiterBff: (...args: unknown[]) => mockRequestRecruiterBff(...args),
}));

describe('simulationLifecycle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('activateSimulationInviting returns ok:false when request rejects', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce(new Error('network down'));

    const result = await activateSimulationInviting('sim-1');
    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
      }),
    );
    expect(result).toHaveProperty('statusCode');
    expect(result.message).toBeTruthy();
  });

  it('regenerateSimulationScenario returns ok:false when request rejects', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce(new Error('network down'));

    const result = await regenerateSimulationScenario('sim-1');
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('statusCode');
    expect(result.message).toBeTruthy();
  });

  it('retrySimulationGeneration returns ok:false when request rejects', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce({
      status: 503,
      message: 'Service unavailable',
    });

    const result = await retrySimulationGeneration('sim-1');
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.message).toBe('Service unavailable');
  });

  it('terminateSimulation posts to terminate endpoint and returns cleanup IDs', async () => {
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
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('terminateSimulation treats idempotent conflict with terminated payload as success', async () => {
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
});
