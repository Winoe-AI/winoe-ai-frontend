import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { logTrialDetailEvent } from '../../utils/eventsUtils';
import { regenerateScenarioAction } from '../actions/regenerateScenarioAction';
import type { UseTrialScenarioActionsArgs } from './useTrialScenarioActions.types';

type UseRegenerateScenarioCallbackArgs = Pick<
  UseTrialScenarioActionsArgs,
  | 'trialId'
  | 'trialStatus'
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
  trialId,
  trialStatus,
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
      trialId,
      trialStatus,
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
      logEvent: logTrialDetailEvent,
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
    trialId,
    trialStatus,
  ]);
}
