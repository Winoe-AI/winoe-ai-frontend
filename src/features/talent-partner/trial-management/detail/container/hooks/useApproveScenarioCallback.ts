import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logTrialDetailEvent } from '../../utils/eventsUtils';
import { approveScenarioAction } from '../actions/approveScenarioAction';
import type { UseTrialScenarioActionsArgs } from './useTrialScenarioActions.types';

type UseApproveScenarioCallbackArgs = Pick<
  UseTrialScenarioActionsArgs,
  | 'canApprove'
  | 'selectedScenarioVersion'
  | 'selectedScenarioVersionIndex'
  | 'trialId'
  | 'trialStatus'
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
  trialId,
  trialStatus,
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
      trialId,
      trialStatus,
      setActionError,
      setApproveLoading,
      setStatusOverride,
      setPendingRegeneration,
      refreshPlan,
      logEvent: logTrialDetailEvent,
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
    trialId,
    trialStatus,
  ]);
}
