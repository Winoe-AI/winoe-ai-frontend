import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logSimulationDetailEvent } from '../../utils/eventsUtils';
import { approveScenarioAction } from '../actions/approveScenarioAction';
import type { UseSimulationScenarioActionsArgs } from './useSimulationScenarioActions.types';

type UseApproveScenarioCallbackArgs = Pick<
  UseSimulationScenarioActionsArgs,
  | 'canApprove'
  | 'selectedScenarioVersion'
  | 'selectedScenarioVersionIndex'
  | 'simulationId'
  | 'simulationStatus'
  | 'setActionError'
  | 'setStatusOverride'
  | 'setPendingRegeneration'
  | 'refreshPlan'
> & {
  approveLoading: boolean;
  setApproveLoading: Dispatch<SetStateAction<boolean>>;
};

export function useApproveScenarioCallback({
  canApprove,
  selectedScenarioVersion,
  selectedScenarioVersionIndex,
  simulationId,
  simulationStatus,
  setActionError,
  setStatusOverride,
  setPendingRegeneration,
  refreshPlan,
  approveLoading,
  setApproveLoading,
}: UseApproveScenarioCallbackArgs) {
  return useCallback(async () => {
    await approveScenarioAction({
      canApprove,
      approveLoading,
      selectedScenarioVersionId: selectedScenarioVersion?.id,
      selectedScenarioVersionIndex,
      simulationId,
      simulationStatus,
      setActionError,
      setApproveLoading,
      setStatusOverride,
      setPendingRegeneration,
      refreshPlan,
      logEvent: logSimulationDetailEvent,
    });
  }, [
    approveLoading,
    canApprove,
    refreshPlan,
    selectedScenarioVersion?.id,
    selectedScenarioVersionIndex,
    setActionError,
    setApproveLoading,
    setPendingRegeneration,
    setStatusOverride,
    simulationId,
    simulationStatus,
  ]);
}
