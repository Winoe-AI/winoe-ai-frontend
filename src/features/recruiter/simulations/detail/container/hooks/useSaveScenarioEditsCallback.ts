import { useCallback } from 'react';
import type { ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';
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
  return useCallback(
    async (payload: ScenarioPatchPayload) => {
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
    },
    [
      refreshPlan,
      scenarioEditorDisabled,
      scenarioEditorSaving,
      selectedScenarioVersion?.contentAvailability,
      selectedScenarioVersion?.id,
      setScenarioEditorFieldErrors,
      setScenarioEditorSaveError,
      setScenarioEditorSaving,
      setScenarioLockBannerMessage,
      setScenarioVersionSnapshots,
      simulationId,
    ],
  );
}
