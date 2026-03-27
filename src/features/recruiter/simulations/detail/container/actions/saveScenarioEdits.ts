import type { Dispatch, SetStateAction } from 'react';
import { patchScenarioVersion, type ScenarioPatchPayload } from '@/features/recruiter/api/simulationLifecycle';
import { toUserMessage } from '@/lib/errors/errors';
import { buildActionError } from '../actionError';
import { buildScenarioEditorFieldErrors } from '../scenarioEditorErrors';
import type { ScenarioEditorFieldErrors, ScenarioVersionSnapshot } from '../types';

type SaveScenarioEditsArgs = {
  simulationId: string;
  selectedScenarioVersionId: string;
  scenarioEditorDisabled: boolean;
  scenarioEditorSaving: boolean;
  setScenarioEditorSaving: Dispatch<SetStateAction<boolean>>;
  setScenarioEditorSaveError: Dispatch<SetStateAction<string | null>>;
  setScenarioEditorFieldErrors: Dispatch<SetStateAction<ScenarioEditorFieldErrors>>;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  setScenarioVersionSnapshots: Dispatch<SetStateAction<Record<string, ScenarioVersionSnapshot>>>;
  refreshPlan: () => Promise<void>;
  payload: ScenarioPatchPayload;
};

export async function saveScenarioEdits({
  simulationId,
  selectedScenarioVersionId,
  scenarioEditorDisabled,
  scenarioEditorSaving,
  setScenarioEditorSaving,
  setScenarioEditorSaveError,
  setScenarioEditorFieldErrors,
  setScenarioLockBannerMessage,
  setScenarioVersionSnapshots,
  refreshPlan,
  payload,
}: SaveScenarioEditsArgs): Promise<void> {
  if (scenarioEditorDisabled || scenarioEditorSaving) return;
  setScenarioEditorSaving(true);
  setScenarioEditorSaveError(null);
  setScenarioEditorFieldErrors({});
  setScenarioLockBannerMessage(null);
  try {
    const result = await patchScenarioVersion(
      simulationId,
      selectedScenarioVersionId,
      payload,
    );
    if (!result.ok) {
      if (result.statusCode === 409 && result.errorCode === 'SCENARIO_LOCKED') {
        setScenarioLockBannerMessage('This version is locked because invites exist.');
        setScenarioVersionSnapshots((prev) => {
          const current = prev[selectedScenarioVersionId];
          if (!current) return prev;
          return { ...prev, [selectedScenarioVersionId]: { ...current, status: 'locked' } };
        });
        return;
      }
      if (result.statusCode === 422) {
        setScenarioEditorFieldErrors(
          buildScenarioEditorFieldErrors(
            result.details,
            buildActionError(result.message, 'Invalid scenario payload.'),
          ),
        );
      }
      setScenarioEditorSaveError(
        buildActionError(result.message, 'Unable to save scenario edits.'),
      );
      return;
    }
    const patchStatus = (result.data as { status?: string | null } | null | undefined)?.status ?? null;
    setScenarioVersionSnapshots((prev) => {
      const current = prev[selectedScenarioVersionId];
      if (!current) return prev;
      return {
        ...prev,
        [selectedScenarioVersionId]: {
          ...current,
          status: patchStatus ?? current.status,
          storylineMd:
            payload.storylineMd !== undefined ? (payload.storylineMd ?? null) : current.storylineMd,
          taskPrompts: payload.taskPrompts !== undefined ? payload.taskPrompts : current.taskPrompts,
          rubric: payload.rubric !== undefined ? payload.rubric : current.rubric,
        },
      };
    });
    await refreshPlan();
  } catch (caught: unknown) {
    setScenarioEditorSaveError(
      buildActionError(
        toUserMessage(caught, 'Unable to save scenario edits.', {
          includeDetail: false,
        }),
        'Unable to save scenario edits.',
      ),
    );
  } finally {
    setScenarioEditorSaving(false);
  }
}
