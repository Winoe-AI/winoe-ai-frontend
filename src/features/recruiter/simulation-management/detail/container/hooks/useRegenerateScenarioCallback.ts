import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logSimulationDetailEvent } from '../../utils/eventsUtils';
import { regenerateScenarioAction } from '../actions/regenerateScenarioAction';
import type { UseSimulationScenarioActionsArgs } from './useSimulationScenarioActions.types';

type UseRegenerateScenarioCallbackArgs = Pick<
  UseSimulationScenarioActionsArgs,
  | 'simulationId'
  | 'simulationStatus'
  | 'selectedScenarioVersionIndex'
  | 'scenarioVersionSnapshots'
  | 'setActionError'
  | 'setScenarioVersionSnapshots'
  | 'setSelectedScenarioVersionId'
  | 'setScenarioEditorSaveError'
  | 'setScenarioEditorFieldErrors'
  | 'setScenarioLockBannerMessage'
  | 'setPendingRegeneration'
  | 'refreshPlan'
> & {
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  setRegenerateLoading: Dispatch<SetStateAction<boolean>>;
};

export function useRegenerateScenarioCallback({
  simulationId,
  simulationStatus,
  selectedScenarioVersionIndex,
  scenarioVersionSnapshots,
  setActionError,
  setScenarioVersionSnapshots,
  setSelectedScenarioVersionId,
  setScenarioEditorSaveError,
  setScenarioEditorFieldErrors,
  setScenarioLockBannerMessage,
  setPendingRegeneration,
  refreshPlan,
  regenerateLoading,
  regenerateDisabled,
  setRegenerateLoading,
}: UseRegenerateScenarioCallbackArgs) {
  return useCallback(async () => {
    await regenerateScenarioAction({
      regenerateLoading,
      regenerateDisabled,
      simulationId,
      simulationStatus,
      selectedScenarioVersionIndex,
      scenarioVersionSnapshots,
      setActionError,
      setRegenerateLoading,
      setScenarioVersionSnapshots,
      setSelectedScenarioVersionId,
      setScenarioEditorSaveError,
      setScenarioEditorFieldErrors,
      setScenarioLockBannerMessage,
      setPendingRegeneration,
      refreshPlan,
      logEvent: logSimulationDetailEvent,
    });
  }, [
    refreshPlan,
    regenerateDisabled,
    regenerateLoading,
    scenarioVersionSnapshots,
    selectedScenarioVersionIndex,
    setActionError,
    setPendingRegeneration,
    setRegenerateLoading,
    setScenarioEditorFieldErrors,
    setScenarioEditorSaveError,
    setScenarioLockBannerMessage,
    setScenarioVersionSnapshots,
    setSelectedScenarioVersionId,
    simulationId,
    simulationStatus,
  ]);
}
