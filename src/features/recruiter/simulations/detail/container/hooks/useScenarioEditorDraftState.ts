import { useCallback, useState } from 'react';
import { areScenarioEditorDraftsEqual } from '../scenarioEditorErrors';
import type { ScenarioEditorDraft } from '../../scenario';
import type { ScenarioEditorDraftMap } from './useSimulationScenarioActions.types';

type UseScenarioEditorDraftStateArgs = {
  selectedScenarioVersionId: string | null;
};

export function useScenarioEditorDraftState({
  selectedScenarioVersionId,
}: UseScenarioEditorDraftStateArgs) {
  const [scenarioEditorDrafts, setScenarioEditorDrafts] =
    useState<ScenarioEditorDraftMap>({});

  const selectedScenarioEditorDraft =
    (selectedScenarioVersionId
      ? scenarioEditorDrafts[selectedScenarioVersionId]
      : undefined) ?? null;

  const onScenarioEditorDraftChange = useCallback(
    (versionId: string, draft: ScenarioEditorDraft) => {
      setScenarioEditorDrafts((prev) => {
        if (!draft.isDirty) {
          if (!Object.prototype.hasOwnProperty.call(prev, versionId)) {
            return prev;
          }
          const next = { ...prev };
          delete next[versionId];
          return next;
        }

        if (areScenarioEditorDraftsEqual({ left: prev[versionId], right: draft })) {
          return prev;
        }

        return {
          ...prev,
          [versionId]: draft,
        };
      });
    },
    [],
  );

  return {
    selectedScenarioEditorDraft,
    onScenarioEditorDraftChange,
  };
}
