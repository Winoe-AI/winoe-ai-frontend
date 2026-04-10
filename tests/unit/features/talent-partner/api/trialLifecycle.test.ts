import {
  activateTrialInviting,
  approveScenarioVersion,
  patchScenarioVersion,
  regenerateTrialScenario,
  retryTrialGeneration,
} from '@/features/talent-partner/api/trialLifecycleApi';

const mockRequestTalentPartnerBff = jest.fn();

jest.mock('@/features/talent-partner/api/requestTalentPartnerBffApi', () => ({
  requestTalentPartnerBff: (...args: unknown[]) =>
    mockRequestTalentPartnerBff(...args),
}));

describe('trialLifecycle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it.each([
    ['activateTrialInviting', activateTrialInviting],
    ['regenerateTrialScenario', regenerateTrialScenario],
  ])('%s returns ok:false when request rejects', async (_name, call) => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce(
      new Error('network down'),
    );
    const result = await call('trial-1');
    expect(result.ok).toBe(false);
    expect(result).toHaveProperty('statusCode');
    expect(result.message).toBeTruthy();
  });

  it('approveScenarioVersion posts to version-specific approve endpoint', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: {
        trialId: 42,
        status: 'active_inviting',
        activeScenarioVersionId: 99,
        pendingScenarioVersionId: null,
      },
    });

    const result = await approveScenarioVersion('trial-1', 99);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      trialId: '42',
      status: 'active_inviting',
      activeScenarioVersionId: '99',
      pendingScenarioVersionId: null,
    });
    expect(mockRequestTalentPartnerBff).toHaveBeenCalledWith(
      '/backend/trials/trial-1/scenario/99/approve',
      { method: 'POST' },
    );
  });

  it('patchScenarioVersion returns SCENARIO_LOCKED details from 409 responses', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({
      status: 409,
      details: {
        detail: 'Scenario version is locked.',
        errorCode: 'SCENARIO_LOCKED',
      },
      message: 'Scenario version is locked.',
    });

    const result = await patchScenarioVersion('trial-1', '12', {
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

  it('retryTrialGeneration returns ok:false when request rejects', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({
      status: 503,
      message: 'Service unavailable',
    });

    const result = await retryTrialGeneration('trial-1');
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(503);
    expect(result.message).toBe('Service unavailable');
  });
});
