import type { ScenarioVersionItem } from '../../scenario';
import type { PlanDaySlot } from '../types';
import { deriveScenarioVersionViewFields } from './useDeriveScenarioVersionViewFields';

type Params = {
  selectedScenarioVersion: ScenarioVersionItem | null;
  detailScenarioVersionIndex: number | null;
  detailHasJobFailure: boolean;
  detailGenerationErrorMessage: string | null;
  detailGenerationErrorCode: string | null;
  trialStatus: string | null;
  scenarioLabel: string | null;
  rubricSummary: string | null;
  planDays: PlanDaySlot[];
  scenarioLockBannerMessage: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
};

export function useScenarioVersionDerivedView({
  selectedScenarioVersion,
  detailScenarioVersionIndex,
  detailHasJobFailure,
  detailGenerationErrorMessage,
  detailGenerationErrorCode,
  trialStatus,
  scenarioLabel,
  rubricSummary,
  planDays,
  scenarioLockBannerMessage,
  activeScenarioVersionId,
  pendingScenarioVersionId,
}: Params) {
  return deriveScenarioVersionViewFields({
    selectedScenarioVersion,
    detailScenarioVersionIndex,
    detailHasJobFailure,
    detailGenerationErrorMessage,
    detailGenerationErrorCode,
    trialStatus,
    scenarioLabel,
    rubricSummary,
    planDays,
    scenarioLockBannerMessage,
    activeScenarioVersionId,
    pendingScenarioVersionId,
  });
}
