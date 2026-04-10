import type { Dispatch, SetStateAction } from 'react';
import { regenerateTrialScenario } from '@/features/talent-partner/api/trialLifecycleApi';
import { toUserMessage } from '@/platform/errors/errors';
import { buildActionError } from '../actionError';
import {
  inferNextVersionIndex,
  mergeScenarioSnapshot,
} from '../scenarioSnapshotVersion';
import type {
  RegenerationPollState,
  ScenarioEditorFieldErrors,
  ScenarioVersionSnapshot,
} from '../types';
import type { logTrialDetailEvent } from '../../utils/eventsUtils';

type RegenerateScenarioArgs = {
  regenerateLoading: boolean;
  regenerateDisabled: boolean;
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  scenarioVersionSnapshots: Record<string, ScenarioVersionSnapshot>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setRegenerateLoading: Dispatch<SetStateAction<boolean>>;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
  setSelectedScenarioVersionId: Dispatch<SetStateAction<string | null>>;
  setScenarioEditorSaveError: Dispatch<SetStateAction<string | null>>;
  setScenarioEditorFieldErrors: Dispatch<
    SetStateAction<ScenarioEditorFieldErrors>
  >;
  setScenarioLockBannerMessage: Dispatch<SetStateAction<string | null>>;
  setPendingRegeneration: Dispatch<
    SetStateAction<RegenerationPollState | null>
  >;
  refreshPlan: () => Promise<void>;
  logEvent: typeof logTrialDetailEvent;
};

export async function regenerateScenarioAction({
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
  logEvent,
}: RegenerateScenarioArgs): Promise<void> {
  if (regenerateLoading || regenerateDisabled) return;
  setActionError(null);
  setRegenerateLoading(true);
  logEvent('regenerate_clicked', {
    trialId,
    status: trialStatus,
    scenarioVersion: selectedScenarioVersionIndex,
  });
  try {
    const result = await regenerateTrialScenario(trialId);
    if (!result.ok) {
      setActionError(
        buildActionError(result.message, 'Unable to regenerate scenario.'),
      );
      return;
    }
    const regenerated = result.data;
    if (!regenerated?.scenarioVersionId) {
      setActionError(
        'Scenario regeneration started, but version metadata was missing.',
      );
      await refreshPlan();
      return;
    }
    const nextVersionIndex = inferNextVersionIndex(
      Object.values(scenarioVersionSnapshots),
      selectedScenarioVersionIndex,
    );
    setScenarioVersionSnapshots((prev) => ({
      ...prev,
      [regenerated.scenarioVersionId]: mergeScenarioSnapshot(
        prev[regenerated.scenarioVersionId],
        {
          id: regenerated.scenarioVersionId,
          versionIndex: nextVersionIndex,
          status: regenerated.status ?? 'generating',
          lockedAt: null,
          contentAvailability: 'local_only',
          storylineMd: null,
          taskPrompts: null,
          rubric: null,
        },
      ),
    }));
    setSelectedScenarioVersionId(regenerated.scenarioVersionId);
    setScenarioEditorSaveError(null);
    setScenarioEditorFieldErrors({});
    setScenarioLockBannerMessage(null);
    if (regenerated.jobId) {
      setPendingRegeneration({
        jobId: regenerated.jobId,
        scenarioVersionId: regenerated.scenarioVersionId,
        pollAfterMs: null,
        attempt: 0,
      });
    }
    await refreshPlan();
  } catch (caught: unknown) {
    setActionError(
      buildActionError(
        toUserMessage(caught, 'Unable to regenerate scenario.', {
          includeDetail: false,
        }),
        'Unable to regenerate scenario.',
      ),
    );
  } finally {
    setRegenerateLoading(false);
  }
}
