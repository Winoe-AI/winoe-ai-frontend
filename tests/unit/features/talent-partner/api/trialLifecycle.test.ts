import {
  activateTrialInviting,
  approveTrialForInviting,
  approveScenarioVersion,
  patchScenarioVersion,
  regenerateTrialScenario,
  retryTrialGeneration,
} from '@/features/talent-partner/api/trialLifecycleApi';
import { mapActionError } from '@/features/talent-partner/api/trialLifecycle.errorsApi';

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

  it('approveTrialForInviting posts to the trials approve BFF route', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({
      data: { trialId: 1, status: 'active_inviting' },
    });

    const result = await approveTrialForInviting('trial-77');
    expect(result.ok).toBe(true);
    expect(mockRequestTalentPartnerBff).toHaveBeenCalledWith(
      '/trials/trial-77/approve',
      { method: 'POST', body: { confirm: true } },
    );
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

  it('activateTrialInviting posts to the activate endpoint', async () => {
    mockRequestTalentPartnerBff.mockResolvedValueOnce({ data: { ok: true } });

    const result = await activateTrialInviting('trial-1');
    expect(result.ok).toBe(true);
    expect(mockRequestTalentPartnerBff).toHaveBeenCalledWith(
      '/backend/trials/trial-1/activate',
      { method: 'POST', body: { confirm: true } },
    );
  });

  it('activateTrialInviting maps failures with activate copy', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({});

    const result = await activateTrialInviting('trial-1');
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Unable to activate trial/i);
  });

  it('approveTrialForInviting maps SCENARIO_APPROVAL_PENDING with actionable copy', async () => {
    mockRequestTalentPartnerBff.mockRejectedValueOnce({
      status: 409,
      errorCode: 'SCENARIO_APPROVAL_PENDING',
    });

    const result = await approveTrialForInviting('trial-88');
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe('SCENARIO_APPROVAL_PENDING');
    expect(result.message).toMatch(/pending scenario version/i);
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

  it('mapActionError strips raw GitHub URLs from generic mapped messages', () => {
    const res = mapActionError(
      {
        status: 502,
        message:
          'GitHub API error (400) (https://api.github.com/repos/o/r/codespaces)',
      },
      'Safe fallback',
    );
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Safe fallback');
    expect(res.message).not.toMatch(/api\.github\.com/);
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
