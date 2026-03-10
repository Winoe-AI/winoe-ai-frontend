import {
  activateSimulationInviting,
  approveScenarioVersion,
  patchScenarioVersion,
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
      { method: 'POST', body: { confirm: true } },
    );
  });

  it('terminateSimulation sends confirm:true payload', async () => {
    mockRequestRecruiterBff.mockResolvedValueOnce({
      data: {
        simulationId: 'sim-1',
        status: 'terminated',
      },
    });

    await terminateSimulation('sim-1');
    expect(mockRequestRecruiterBff).toHaveBeenCalledTimes(1);
    expect(mockRequestRecruiterBff.mock.calls[0][1]).toEqual({
      method: 'POST',
      body: { confirm: true },
    });
  });

  it('terminateSimulation returns ok:false when status is missing from success payload', async () => {
    mockRequestRecruiterBff.mockResolvedValueOnce({
      data: {
        simulationId: 42,
        cleanupJobIds: ['job-1'],
      },
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

  it('terminateSimulation returns ok:false for 409 when payload is missing explicit terminated status', async () => {
    mockRequestRecruiterBff.mockRejectedValueOnce({
      status: 409,
      details: {
        simulationId: 'sim-1',
        cleanupJobIds: ['cleanup-1'],
      },
    });

    const result = await terminateSimulation('sim-1');
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(409);
    expect(result.message).toBe('Unable to terminate simulation.');
  });
});
