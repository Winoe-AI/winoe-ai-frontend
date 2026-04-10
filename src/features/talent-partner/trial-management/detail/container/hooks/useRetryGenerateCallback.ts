import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logTrialDetailEvent } from '../../utils/eventsUtils';
import { retryGenerateAction } from '../actions/retryGenerateAction';
import type { UseTrialScenarioActionsArgs } from './useTrialScenarioActions.types';

type UseRetryGenerateCallbackArgs = Pick<
  UseTrialScenarioActionsArgs,
  | 'trialId'
  | 'trialStatus'
  | 'selectedScenarioVersionIndex'
  | 'setActionError'
  | 'refreshPlan'
> & {
  retryGenerateLoading: boolean;
  setRetryGenerateLoading: Dispatch<SetStateAction<boolean>>;
};

export function useRetryGenerateCallback({
  trialId,
  trialStatus,
  selectedScenarioVersionIndex,
  setActionError,
  refreshPlan,
  retryGenerateLoading,
  setRetryGenerateLoading,
}: UseRetryGenerateCallbackArgs) {
  return useCallback(async () => {
    await retryGenerateAction({
      retryGenerateLoading,
      trialId,
      trialStatus,
      selectedScenarioVersionIndex,
      setActionError,
      setRetryGenerateLoading,
      refreshPlan,
      logEvent: logTrialDetailEvent,
    });
  }, [
    refreshPlan,
    retryGenerateLoading,
    selectedScenarioVersionIndex,
    setActionError,
    setRetryGenerateLoading,
    trialId,
    trialStatus,
  ]);
}
