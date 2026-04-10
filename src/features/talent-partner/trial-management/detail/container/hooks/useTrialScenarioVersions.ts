import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { TrialDetailPreview } from '../../utils/detailUtils';
import { taskPromptsFromPlanDays } from '../scenarioSnapshotData';
import type { PlanDaySlot } from '../types';
import { useScenarioRegenerationPoll } from './useScenarioRegenerationPoll';
import { useScenarioVersionDerivedView } from './useScenarioVersionDerivedView';
import { useScenarioVersionSnapshotSync } from './useScenarioVersionSnapshotSync';
import { useScenarioVersionState } from './useScenarioVersionState';
import { useScenarioVersionsList } from './useScenarioVersionsList';
import { useSelectedScenarioVersion } from './useSelectedScenarioVersion';

type UseTrialScenarioVersionsArgs = {
  trialId: string;
  detail: TrialDetailPreview | null;
  planDays: PlanDaySlot[];
  scenarioLabel: string | null;
  rubricSummary: string | null;
  trialStatus: string | null;
  isGenerating: boolean;
  refreshPlan: () => Promise<void>;
  setActionError: Dispatch<SetStateAction<string | null>>;
};

export function useTrialScenarioVersions({
  trialId,
  detail,
  planDays,
  scenarioLabel,
  rubricSummary,
  trialStatus,
  isGenerating,
  refreshPlan,
  setActionError,
}: UseTrialScenarioVersionsArgs) {
  const state = useScenarioVersionState(trialId);
  const fallbackTaskPrompts = useMemo(
    () => taskPromptsFromPlanDays(planDays),
    [planDays],
  );
  useScenarioVersionSnapshotSync({
    detail,
    fallbackTaskPrompts,
    pendingRegenerationScenarioVersionId:
      state.pendingRegeneration?.scenarioVersionId ?? null,
    setScenarioVersionSnapshots: state.setScenarioVersionSnapshots,
  });
  useScenarioRegenerationPoll({
    trialId,
    detail,
    pendingRegeneration: state.pendingRegeneration,
    setPendingRegeneration: state.setPendingRegeneration,
    refreshPlan,
    setActionError,
    setScenarioVersionSnapshots: state.setScenarioVersionSnapshots,
  });
  const activeScenarioVersionId =
    detail?.activeScenarioVersionId ?? detail?.scenarioVersion.id ?? null;
  const pendingScenarioVersionId = detail?.pendingScenarioVersionId ?? null;
  const scenarioVersions = useScenarioVersionsList({
    scenarioVersionSnapshots: state.scenarioVersionSnapshots,
    activeScenarioVersionId,
    pendingScenarioVersionId,
    pendingRegenerationScenarioVersionId:
      state.pendingRegeneration?.scenarioVersionId ?? null,
    isGenerating,
    trialStatus,
  });
  const selected = useSelectedScenarioVersion({
    scenarioVersions,
    activeScenarioVersionId,
    pendingScenarioVersionId,
  });
  const derived = useScenarioVersionDerivedView({
    selectedScenarioVersion: selected.selectedScenarioVersion,
    detailScenarioVersionIndex: detail?.scenarioVersion.versionIndex ?? null,
    detailHasJobFailure: Boolean(detail?.hasJobFailure),
    detailGenerationErrorMessage: detail?.generationJob?.errorMessage ?? null,
    detailGenerationErrorCode: detail?.generationJob?.errorCode ?? null,
    trialStatus,
    scenarioLabel,
    rubricSummary,
    planDays,
    scenarioLockBannerMessage: state.scenarioLockBannerMessage,
    activeScenarioVersionId,
    pendingScenarioVersionId,
  });
  return {
    activeScenarioVersionId,
    pendingScenarioVersionId,
    ...state,
    scenarioVersions,
    ...selected,
    ...derived,
  };
}
