import type { ScenarioVersionItem } from '../../scenario';
import type { PlanDaySlot } from '../types';
import { deriveScenarioVersionViewFields } from './deriveScenarioVersionViewFields';

type Params = {
  selectedScenarioVersion: ScenarioVersionItem | null;
  detailScenarioVersionIndex: number | null;
  detailHasJobFailure: boolean;
  detailGenerationErrorMessage: string | null;
  detailGenerationErrorCode: string | null;
  simulationStatus: string | null;
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
  simulationStatus,
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
    simulationStatus,
    scenarioLabel,
    rubricSummary,
    planDays,
    scenarioLockBannerMessage,
    activeScenarioVersionId,
    pendingScenarioVersionId,
  });
}
