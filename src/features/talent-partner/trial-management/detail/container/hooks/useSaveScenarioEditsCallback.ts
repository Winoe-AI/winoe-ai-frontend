import type { ScenarioPatchPayload } from '@/features/talent-partner/api/trialLifecycleApi';
import { saveScenarioEdits } from '../actions/saveScenarioEdits';
import type { UseTrialScenarioActionsArgs } from './useTrialScenarioActions.types';

type UseSaveScenarioEditsCallbackArgs = Pick<
  UseTrialScenarioActionsArgs,
  | 'trialId'
  | 'selectedScenarioVersion'
  | 'scenarioEditorDisabled'
  | 'scenarioEditorSaving'
  | 'setScenarioEditorSaving'
  | 'setScenarioEditorSaveError'
  | 'setScenarioEditorFieldErrors'
  | 'setScenarioLockBannerMessage'
  | 'setScenarioVersionSnapshots'
  | 'refreshPlan'
>;

export function useSaveScenarioEditsCallback({
  trialId,
  selectedScenarioVersion,
  scenarioEditorDisabled,
  scenarioEditorSaving,
  setScenarioEditorSaving,
  setScenarioEditorSaveError,
  setScenarioEditorFieldErrors,
  setScenarioLockBannerMessage,
  setScenarioVersionSnapshots,
  refreshPlan,
}: UseSaveScenarioEditsCallbackArgs) {
  return async (payload: ScenarioPatchPayload) => {
    if (
      !selectedScenarioVersion?.id ||
      selectedScenarioVersion.contentAvailability !== 'canonical'
    ) {
      return;
    }

    await saveScenarioEdits({
      trialId,
      selectedScenarioVersionId: selectedScenarioVersion.id,
      scenarioEditorDisabled,
      scenarioEditorSaving,
      setScenarioEditorSaving,
      setScenarioEditorSaveError,
      setScenarioEditorFieldErrors,
      setScenarioLockBannerMessage,
      setScenarioVersionSnapshots,
      refreshPlan,
      payload,
    });
  };
}
