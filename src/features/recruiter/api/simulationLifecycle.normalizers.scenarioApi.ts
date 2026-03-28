import { toStringOrNull } from '@/features/recruiter/simulation-management/detail/utils/parsingUtils';
import type {
  ScenarioApproveResponse,
  ScenarioPatchResponse,
  ScenarioRegenerateResponse,
} from './simulationLifecycle.typesApi';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return toStringOrNull(value);
}

export function toScenarioRegenerateResponse(
  data: unknown,
): ScenarioRegenerateResponse | null {
  const record = asRecord(data);
  if (!record) return null;

  const scenarioVersionId = toId(
    record.scenarioVersionId ?? record.scenario_version_id ?? record.id,
  );
  if (!scenarioVersionId) return null;

  return {
    scenarioVersionId,
    jobId: toId(record.jobId ?? record.job_id),
    status: toStringOrNull(record.status)?.toLowerCase() ?? null,
  };
}

export function toScenarioApproveResponse(
  data: unknown,
): ScenarioApproveResponse | null {
  const record = asRecord(data);
  if (!record) return null;
  const simulationId = toId(
    record.simulationId ?? record.simulation_id ?? record.id,
  );

  return {
    simulationId: simulationId ?? '',
    status: toStringOrNull(record.status)?.toLowerCase() ?? null,
    activeScenarioVersionId: toId(
      record.activeScenarioVersionId ?? record.active_scenario_version_id,
    ),
    pendingScenarioVersionId: toId(
      record.pendingScenarioVersionId ?? record.pending_scenario_version_id,
    ),
  };
}

export function toScenarioPatchResponse(
  data: unknown,
): ScenarioPatchResponse | null {
  const record = asRecord(data);
  if (!record) return null;

  const scenarioVersionId = toId(
    record.scenarioVersionId ?? record.scenario_version_id ?? record.id,
  );
  if (!scenarioVersionId) return null;

  return {
    scenarioVersionId,
    status: toStringOrNull(record.status)?.toLowerCase() ?? null,
  };
}
