import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ScenarioEditorFieldErrors } from '../types';

type UseSelectScenarioVersionCallbackArgs = {
  scenarioEditorSaveError: string | null;
  setScenarioEditorSaveError: Dispatch<SetStateAction<string | null>>;
  setScenarioEditorFieldErrors: Dispatch<
    SetStateAction<ScenarioEditorFieldErrors>
  >;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  setSelectedScenarioVersionId: Dispatch<SetStateAction<string | null>>;
};

export function useSelectScenarioVersionCallback({
  scenarioEditorSaveError,
  setScenarioEditorSaveError,
  setScenarioEditorFieldErrors,
  setScenarioLockBannerMessage,
  setSelectedScenarioVersionId,
}: UseSelectScenarioVersionCallbackArgs) {
  return useCallback(
    (versionId: string) => {
      setSelectedScenarioVersionId(versionId);
      if (scenarioEditorSaveError) {
        setScenarioEditorSaveError(null);
      }
      setScenarioEditorFieldErrors({});
      setScenarioLockBannerMessage(null);
    },
    [
      scenarioEditorSaveError,
      setScenarioEditorFieldErrors,
      setScenarioLockBannerMessage,
      setScenarioEditorSaveError,
      setSelectedScenarioVersionId,
    ],
  );
}
