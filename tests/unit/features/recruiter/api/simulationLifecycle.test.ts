import {
  activateSimulationInviting,
  approveScenarioVersion,
  patchScenarioVersion,
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

  it.each([
    ['activateSimulationInviting', activateSimulationInviting],
    ['regenerateSimulationScenario', regenerateSimulationScenario],
  ])('%s returns ok:false when request rejects', async (_name, call) => {
    mockRequestRecruiterBff.mockRejectedValueOnce(new Error('network down'));
    const result = await call('sim-1');
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('statusCode');
    expect(result.message).toBeTruthy();
  });

  it('approveScenarioVersion posts to version-specific approve endpoint', async () => {
    mockRequestRecruiterBff.mockResolvedValueOnce({
      data: {
        simulationId: 42,
        status: 'active_inviting',
        activeScenarioVersionId: 99,
        pendingScenarioVersionId: null,
      },
    });

    const result = await approveScenarioVersion('sim-1', 99);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      simulationId: '42',
      status: 'active_inviting',
      activeScenarioVersionId: '99',
      pendingScenarioVersionId: null,
    });
    expect(mockRequestRecruiterBff).toHaveBeenCalledWith(
      '/backend/simulations/sim-1/scenario/99/approve',
      { method: 'POST' },
    );
  });

  it('patchScenarioVersion returns SCENARIO_LOCKED details from 409 responses', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce({
      status: 409,
      details: {
        detail: 'Scenario version is locked.',
        errorCode: 'SCENARIO_LOCKED',
      },
      message: 'Scenario version is locked.',
    });

    const result = await patchScenarioVersion('sim-1', '12', {
      storylineMd: 'Updated',
    });
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.errorCode).toBe('SCENARIO_LOCKED');
    expect(result.details).toEqual({
      detail: 'Scenario version is locked.',
      errorCode: 'SCENARIO_LOCKED',
    });
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
