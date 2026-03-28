import { normalizeSimulationEvalEnabledByDay } from '@/features/recruiter/api/simulationAiEvalApi';
import { toStringOrNull } from '../parsingUtils';
import { normalizeSimulationPlan } from '../plan';
import {
  readCompanyContext,
  readNotes,
  readRubricJson,
  readRubricSummary,
  readStoryline,
  readTaskPromptsJson,
} from './contentUtils';
import { readGenerationJob } from './generationJobUtils';
import {
  asRecord,
  isFailureStatus,
  parseLifecycleStatus,
  toNonEmptyString,
} from './parsersUtils';
import {
  mergeScenarioVersions,
  readScenarioVersionList,
} from './scenarioVersionCollectionUtils';
import { normalizeScenarioVersion } from './scenarioVersionNormalizeUtils';
import type {
  SimulationDetailPreview,
  SimulationScenarioVersion,
} from './typesUtils';

export function normalizeSimulationDetailPreview(
  raw: unknown,
): SimulationDetailPreview {
  const plan = normalizeSimulationPlan(raw);
  const record = asRecord(raw) ?? {};
  const scenario = asRecord(record.scenario);
  const ai = asRecord(record.ai);
  const statusRaw = toStringOrNull(record.status)?.toLowerCase() ?? null;
  const status = parseLifecycleStatus(statusRaw);
  const activeScenarioVersionId =
    toNonEmptyString(
      record.activeScenarioVersionId ??
        record.active_scenario_version_id ??
        scenario?.id,
    ) ?? null;
  const pendingScenarioVersionId =
    toNonEmptyString(
      record.pendingScenarioVersionId ?? record.pending_scenario_version_id,
    ) ?? null;
  const scenarioVersion = normalizeScenarioVersion(
    record,
    scenario,
    activeScenarioVersionId,
  );
  const generationJob = readGenerationJob(record, scenario);
  const versions = mergeScenarioVersions([
    ...readScenarioVersionList(record),
    scenarioVersion,
    ...(activeScenarioVersionId &&
    scenarioVersion.id !== activeScenarioVersionId
      ? [
          {
            id: activeScenarioVersionId,
            versionIndex: scenarioVersion.versionIndex,
            status: scenarioVersion.status,
            lockedAt: scenarioVersion.lockedAt,
            isLocked: scenarioVersion.isLocked,
            contentAvailability: scenarioVersion.contentAvailability,
          } satisfies SimulationScenarioVersion,
        ]
      : []),
    ...(pendingScenarioVersionId
      ? [
          {
            id: pendingScenarioVersionId,
            versionIndex: null,
            status: null,
            lockedAt: null,
            isLocked: false,
            contentAvailability: 'unavailable',
          } satisfies SimulationScenarioVersion,
        ]
      : []),
  ]);
  return {
    plan,
    status,
    statusRaw,
    activeScenarioVersionId,
    pendingScenarioVersionId,
    scenarioVersions: versions,
    scenarioVersion,
    storyline: readStoryline(record, scenario, plan),
    taskPromptsJson: readTaskPromptsJson(record, scenario),
    rubricJson: readRubricJson(record, scenario),
    notes: readNotes(record, scenario),
    rubricSummary: readRubricSummary(record, scenario),
    level:
      toStringOrNull(record.seniority ?? record.level ?? record.roleLevel) ??
      null,
    companyContext: readCompanyContext(
      record.companyContext ?? record.company_context,
    ),
    aiEvaluationEnabledByDay: normalizeSimulationEvalEnabledByDay(
      ai?.evalEnabledByDay ??
        ai?.eval_enabled_by_day ??
        record.evalEnabledByDay ??
        record.eval_enabled_by_day,
    ),
    generationJob,
    hasJobFailure:
      isFailureStatus(generationJob?.status) ||
      isFailureStatus(scenarioVersion.status) ||
      Boolean(generationJob?.errorMessage),
  };
}
