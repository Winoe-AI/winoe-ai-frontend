import { scenarioVersionLabel } from '../../utils/detailUtils';
import type { ScenarioVersionItem } from '../../scenario';
import type { PlanDaySlot } from '../types';
import { buildPlanDaysForVersion } from '../planDays';
import { deriveSelectedScenarioDisplayStatus } from '../scenarioStatus';
import {
  canApproveSelectedScenario,
  formatScenarioRubricSummary,
  scenarioContentUnavailableMessage,
  scenarioEditorDisabledReason,
} from './useScenarioVersionDerived';

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

export function deriveScenarioVersionViewFields({
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
  const selectedScenarioVersionIndex =
    selectedScenarioVersion?.versionIndex ?? detailScenarioVersionIndex;
  const selectedScenarioVersionText = scenarioVersionLabel(
    selectedScenarioVersion?.versionIndex ?? null,
  );
  const selectedScenarioStatusForDisplay = deriveSelectedScenarioDisplayStatus({
    selectedScenarioVersion,
    simulationStatus,
  });
  const selectedScenarioHasCanonicalContent =
    selectedScenarioVersion?.contentAvailability === 'canonical';
  const scenarioFailureMessage = detailHasJobFailure
    ? (detailGenerationErrorMessage ??
      'Scenario generation failed. Retry generation to continue.')
    : null;
  const scenarioGeneratingLabel =
    selectedScenarioVersion?.uiStatus === 'generating'
      ? `Generating ${selectedScenarioVersionText}...`
      : null;
  const editorDisabledReason = scenarioEditorDisabledReason(
    selectedScenarioVersion,
    simulationStatus,
  );
  const displayedPlanDays =
    selectedScenarioVersion && !selectedScenarioHasCanonicalContent
      ? ([] as PlanDaySlot[])
      : buildPlanDaysForVersion(
          planDays,
          selectedScenarioVersion?.taskPrompts ?? null,
        );

  return {
    selectedScenarioVersionIndex,
    selectedScenarioVersionText,
    selectedScenarioStatusForDisplay,
    selectedScenarioHasCanonicalContent,
    scenarioFailureMessage,
    scenarioFailureCode: detailGenerationErrorCode,
    scenarioGeneratingLabel,
    scenarioContentUnavailableMessage: scenarioContentUnavailableMessage(
      selectedScenarioVersion,
      selectedScenarioVersionText,
    ),
    scenarioEditorDisabledReason: editorDisabledReason,
    scenarioEditorDisabled: editorDisabledReason != null,
    canApprove: canApproveSelectedScenario({
      simulationStatus,
      selectedScenarioVersion,
      pendingScenarioVersionId,
      activeScenarioVersionId,
    }),
    displayedScenarioLabel: selectedScenarioVersion
      ? selectedScenarioHasCanonicalContent
        ? selectedScenarioVersion.storylineMd?.trim() || scenarioLabel
        : null
      : scenarioLabel,
    displayedRubricSummary: formatScenarioRubricSummary(
      selectedScenarioVersion,
      rubricSummary,
      selectedScenarioHasCanonicalContent,
    ),
    displayedPlanDays,
    effectiveLockBannerMessage:
      scenarioLockBannerMessage ??
      (selectedScenarioVersion?.isLocked
        ? 'This version is locked because invites exist.'
        : null),
  };
}
