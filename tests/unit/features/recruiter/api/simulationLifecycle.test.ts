import {
  activateSimulationInviting,
  regenerateSimulationScenario,
  retrySimulationGeneration,
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
});
