import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logSimulationDetailEvent } from '../../utils/eventsUtils';
import { retryGenerateAction } from '../actions/retryGenerateAction';
import type { UseSimulationScenarioActionsArgs } from './useSimulationScenarioActions.types';

type UseRetryGenerateCallbackArgs = Pick<
  UseSimulationScenarioActionsArgs,
  | 'simulationId'
  | 'simulationStatus'
  | 'selectedScenarioVersionIndex'
  | 'setActionError'
  | 'refreshPlan'
> & {
  retryGenerateLoading: boolean;
  setRetryGenerateLoading: Dispatch<SetStateAction<boolean>>;
};

export function useRetryGenerateCallback({
  simulationId,
  simulationStatus,
  selectedScenarioVersionIndex,
  setActionError,
  refreshPlan,
  retryGenerateLoading,
  setRetryGenerateLoading,
}: UseRetryGenerateCallbackArgs) {
  return useCallback(async () => {
    await retryGenerateAction({
      retryGenerateLoading,
      simulationId,
      simulationStatus,
      selectedScenarioVersionIndex,
      setActionError,
      setRetryGenerateLoading,
      refreshPlan,
      logEvent: logSimulationDetailEvent,
    });
  }, [
    refreshPlan,
    retryGenerateLoading,
    selectedScenarioVersionIndex,
    setActionError,
    setRetryGenerateLoading,
    simulationId,
    simulationStatus,
  ]);
}
