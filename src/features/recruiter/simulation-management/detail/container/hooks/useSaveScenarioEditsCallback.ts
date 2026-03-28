import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycleApi';
import { saveScenarioEdits } from '../actions/saveScenarioEdits';
import type { UseSimulationScenarioActionsArgs } from './useSimulationScenarioActions.types';

type UseSaveScenarioEditsCallbackArgs = Pick<
  UseSimulationScenarioActionsArgs,
  | 'simulationId'
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
  simulationId,
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
      simulationId,
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
