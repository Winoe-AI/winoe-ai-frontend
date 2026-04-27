import {
  canActivateSelectedTrial,
  canApproveSelectedScenario,
  scenarioContentUnavailableMessage,
  scenarioEditorDisabledReason,
} from '@/features/talent-partner/trial-management/detail/container/hooks/useScenarioVersionDerived';
import { deriveSelectedScenarioDisplayStatus } from '@/features/talent-partner/trial-management/detail/container/scenarioStatus';

describe('useScenarioVersionDerived', () => {
  const canonicalApprovedVersion = {
    id: '10',
    versionIndex: 1,
    uiStatus: 'approved',
    contentAvailability: 'canonical',
    isLocked: false,
  } as const;

  const canonicalLockedVersion = {
    ...canonicalApprovedVersion,
    uiStatus: 'locked',
    isLocked: true,
  } as const;

  it('treats approved versions as the bridge to activation', () => {
    expect(
      deriveSelectedScenarioDisplayStatus({
        selectedScenarioVersion: canonicalApprovedVersion as never,
        trialStatus: 'ready_for_review',
      }),
    ).toBe('approved');
    expect(
      deriveSelectedScenarioDisplayStatus({
        selectedScenarioVersion: canonicalApprovedVersion as never,
        trialStatus: 'active_inviting',
      }),
    ).toBe('active_inviting');
    expect(
      canApproveSelectedScenario({
        trialStatus: 'ready_for_review',
        selectedScenarioVersion: canonicalApprovedVersion as never,
        pendingScenarioVersionId: null,
        activeScenarioVersionId: '10',
      }),
    ).toBe(false);
    expect(
      canActivateSelectedTrial({
        trialStatus: 'ready_for_review',
        selectedScenarioVersion: canonicalApprovedVersion as never,
      }),
    ).toBe(true);
    expect(
      canActivateSelectedTrial({
        trialStatus: 'ready_for_review',
        selectedScenarioVersion: canonicalLockedVersion as never,
      }),
    ).toBe(true);
    expect(
      canActivateSelectedTrial({
        trialStatus: 'active_inviting',
        selectedScenarioVersion: canonicalApprovedVersion as never,
      }),
    ).toBe(false);
  });

  it('keeps non-canonical versions read-only and unapprovable', () => {
    const localOnlyVersion = {
      ...canonicalApprovedVersion,
      uiStatus: 'ready_for_review',
      contentAvailability: 'local_only',
    } as const;

    expect(
      scenarioContentUnavailableMessage(
        localOnlyVersion as never,
        'Scenario v1',
      ),
    ).toMatch(/draft data from this session/i);
    expect(
      scenarioEditorDisabledReason(
        localOnlyVersion as never,
        'ready_for_review',
      ),
    ).toMatch(/canonical scenario content is unavailable/i);
    expect(
      canApproveSelectedScenario({
        trialStatus: 'ready_for_review',
        selectedScenarioVersion: localOnlyVersion as never,
        pendingScenarioVersionId: null,
        activeScenarioVersionId: '10',
      }),
    ).toBe(false);
  });
});
