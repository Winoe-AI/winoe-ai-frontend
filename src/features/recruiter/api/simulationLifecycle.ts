import { toStatus, toUserMessage } from '@/lib/errors/errors';
import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/recruiter/simulations/detail/utils/parsing';
import type { TerminateSimulationResponse } from './types';
import { requestRecruiterBff } from './requestRecruiterBff';
import { safeId } from './simUtils';

export type SimulationActionResult<TData = unknown> = {
  ok: boolean;
  statusCode?: number | null;
  message?: string | null;
  unsupported?: boolean;
  errorCode?: string | null;
  details?: Record<string, unknown> | null;
  data?: TData;
};

export type SimulationJobStatus = {
  jobId: string;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

export type ScenarioRegenerateResponse = {
  scenarioVersionId: string;
  jobId: string | null;
  status: string | null;
};

export type ScenarioApproveResponse = {
  simulationId: string;
  status: string | null;
  activeScenarioVersionId: string | null;
  pendingScenarioVersionId: string | null;
};

export type ScenarioPatchPayload = {
  storylineMd?: string | null;
  taskPrompts?: Array<Record<string, unknown>>;
  rubric?: Record<string, unknown>;
  notes?: string | null;
};

export type ScenarioPatchResponse = {
  scenarioVersionId: string;
  status: string | null;
};

const UNSUPPORTED_STATUSES = new Set([404, 405, 501]);
const TERMINATE_UNSUPPORTED_STATUSES = new Set([405, 501]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return toStringOrNull(value);
}

function extractErrorDetails(error: unknown): Record<string, unknown> | null {
  const record = asRecord(error);
  const details = asRecord(record?.details);
  if (details) return details;

  const nestedData = asRecord(record?.data);
  if (nestedData) return nestedData;

  const nestedError = asRecord(record?.error);
  if (nestedError) return nestedError;

  return null;
}

function extractActionErrorCode(error: unknown): string | null {
  const record = asRecord(error);
  const details = extractErrorDetails(error);

  const direct = toStringOrNull(record?.errorCode ?? record?.code);
  if (direct) return direct;

  const detailCode = toStringOrNull(
    details?.errorCode ?? details?.error_code ?? details?.code,
  );
  if (detailCode) return detailCode;

  const nestedErrorCode = toStringOrNull(
    asRecord(details?.error)?.code ?? asRecord(details?.error)?.errorCode,
  );
  return nestedErrorCode;
}

function mapActionError(
  error: unknown,
  fallback: string,
  opts?: { unsupportedStatuses?: Set<number> },
): SimulationActionResult {
  try {
    const statusCode = toStatus(error);
    const unsupported = opts?.unsupportedStatuses ?? UNSUPPORTED_STATUSES;
    const details = extractErrorDetails(error);
    const errorCode = extractActionErrorCode(error);

    if (statusCode !== null && unsupported.has(statusCode)) {
      return {
        ok: false,
        statusCode,
        unsupported: true,
        errorCode,
        details,
        message:
          'This action is not available yet. Backend support is pending.',
      };
    }

    if (statusCode === 403) {
      return {
        ok: false,
        statusCode,
        errorCode,
        details,
        message: "You don't have access to perform this action.",
      };
    }

    if (statusCode === 404) {
      return {
        ok: false,
        statusCode,
        errorCode,
        details,
        message: 'Simulation not found.',
      };
    }

    return {
      ok: false,
      statusCode,
      errorCode,
      details,
      message: toUserMessage(error, fallback, { includeDetail: false }),
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: fallback,
    };
  }
}

function toCleanupJobIds(data: Record<string, unknown>): string[] | undefined {
  const raw = data.cleanupJobIds ?? data.cleanup_job_ids;
  if (!Array.isArray(raw)) return undefined;
  const ids = raw
    .map((item) => toStringOrNull(item))
    .filter((item): item is string => Boolean(item));
  return ids.length ? ids : undefined;
}

function toTerminateStatus(value: unknown): string {
  return toStringOrNull(value)?.toLowerCase() ?? ('unknown' as const);
}

function isTerminatedStatus(status: string | null | undefined): boolean {
  return status?.toLowerCase() === 'terminated';
}

function toTerminateResponse(
  data: unknown,
  fallbackSimulationId: string,
): TerminateSimulationResponse {
  const record = asRecord(data);
  const status = toTerminateStatus(record?.status);
  const simulationId =
    toId(record?.simulationId ?? record?.simulation_id ?? record?.id) ??
    fallbackSimulationId;
  return {
    simulationId,
    status,
    cleanupJobIds: record ? toCleanupJobIds(record) : undefined,
  };
}

function maybeIdempotentTerminateFromError(
  error: unknown,
  simulationId: string,
): TerminateSimulationResponse | null {
  const errorRecord = asRecord(error);
  const payload = errorRecord?.details ?? errorRecord?.data ?? error;
  const payloadRecord = asRecord(payload);
  const explicitStatus = toStringOrNull(payloadRecord?.status);
  if (!isTerminatedStatus(explicitStatus)) return null;
  return toTerminateResponse(payload, simulationId);
}

function toScenarioRegenerateResponse(
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

function toScenarioApproveResponse(
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

function toScenarioPatchResponse(data: unknown): ScenarioPatchResponse | null {
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

async function tryPostWithFallback(
  paths: string[],
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<SimulationActionResult> {
  try {
    let lastError: unknown = null;

    for (const path of paths) {
      try {
        const { data } = await requestRecruiterBff<unknown>(path, {
          method: 'POST',
          body,
        });
        return {
          ok: true,
          statusCode: 200,
          message: null,
          errorCode: null,
          details: null,
          data,
        };
      } catch (error) {
        lastError = error;
        const statusCode = toStatus(error);
        if (statusCode !== null && UNSUPPORTED_STATUSES.has(statusCode)) {
          continue;
        }
        return mapActionError(error, fallbackError);
      }
    }

    return mapActionError(lastError, fallbackError);
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: fallbackError,
    };
  }
}

export async function activateSimulationInviting(
  simulationId: string | number,
): Promise<SimulationActionResult> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/activate`,
      {
        method: 'POST',
        body: { confirm: true },
      },
    );
    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data,
    };
  } catch (error) {
    return mapActionError(error, 'Unable to approve simulation.');
  }
}

export async function approveScenarioVersion(
  simulationId: string | number,
  scenarioVersionId: string | number,
): Promise<SimulationActionResult<ScenarioApproveResponse | null>> {
  try {
    const id = safeId(simulationId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation and scenario version IDs are required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}/approve`,
      {
        method: 'POST',
      },
    );

    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data: toScenarioApproveResponse(data),
    };
  } catch (error) {
    return mapActionError(
      error,
      'Unable to approve this scenario version.',
    ) as SimulationActionResult<ScenarioApproveResponse | null>;
  }
}

export async function regenerateSimulationScenario(
  simulationId: string | number,
): Promise<SimulationActionResult<ScenarioRegenerateResponse | null>> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    const result = await tryPostWithFallback(
      [
        `/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`,
        `/backend/simulations/${encodeURIComponent(id)}/regenerate`,
      ],
      { confirm: true, reason: 'regenerate' },
      'Unable to regenerate scenario.',
    );

    if (!result.ok) {
      return result as SimulationActionResult<ScenarioRegenerateResponse | null>;
    }

    return {
      ...result,
      data: toScenarioRegenerateResponse(result.data),
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: 'Unable to regenerate scenario.',
    };
  }
}

export async function patchScenarioVersion(
  simulationId: string | number,
  scenarioVersionId: string | number,
  payload: ScenarioPatchPayload,
): Promise<SimulationActionResult<ScenarioPatchResponse | null>> {
  try {
    const id = safeId(simulationId);
    const versionId = safeId(scenarioVersionId);
    if (!id || !versionId) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation and scenario version IDs are required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/scenario/${encodeURIComponent(versionId)}`,
      {
        method: 'PATCH',
        body: payload,
      },
    );

    return {
      ok: true,
      statusCode: 200,
      message: null,
      errorCode: null,
      details: null,
      data: toScenarioPatchResponse(data),
    };
  } catch (error) {
    return mapActionError(
      error,
      'Unable to save scenario edits.',
    ) as SimulationActionResult<ScenarioPatchResponse | null>;
  }
}

export async function retrySimulationGeneration(
  simulationId: string | number,
): Promise<SimulationActionResult> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    return tryPostWithFallback(
      [
        `/backend/simulations/${encodeURIComponent(id)}/scenario/retry`,
        `/backend/simulations/${encodeURIComponent(id)}/scenario/generate`,
        `/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`,
      ],
      { confirm: true, reason: 'retry_generate' },
      'Unable to retry generation.',
    );
  } catch {
    return {
      ok: false,
      statusCode: null,
      errorCode: null,
      details: null,
      message: 'Unable to retry generation.',
    };
  }
}

export async function terminateSimulation(
  simulationId: string | number,
): Promise<SimulationActionResult & { data?: TerminateSimulationResponse }> {
  try {
    const id = safeId(simulationId);
    if (!id) {
      return {
        ok: false,
        statusCode: 400,
        message: 'Simulation ID is required.',
      };
    }

    const { data } = await requestRecruiterBff<unknown>(
      `/simulations/${encodeURIComponent(id)}/terminate`,
      {
        method: 'POST',
        body: { confirm: true },
      },
    );

    const normalized = toTerminateResponse(data, id);
    const terminated = isTerminatedStatus(normalized.status);
    return {
      ok: terminated,
      statusCode: 200,
      message: terminated ? null : 'Unable to terminate simulation.',
      errorCode: null,
      details: null,
      data: normalized,
    };
  } catch (error) {
    const statusCode = toStatus(error);
    if (statusCode === 409) {
      const id = safeId(simulationId);
      const idempotent = maybeIdempotentTerminateFromError(error, id);
      if (idempotent) {
        return {
          ok: true,
          statusCode: 200,
          message: null,
          errorCode: null,
          details: null,
          data: idempotent,
        };
      }
    }

    const mapped = mapActionError(error, 'Unable to terminate simulation.', {
      unsupportedStatuses: TERMINATE_UNSUPPORTED_STATUSES,
    });
    return {
      ok: mapped.ok,
      statusCode: mapped.statusCode,
      message: mapped.message,
      unsupported: mapped.unsupported,
      errorCode: mapped.errorCode,
      details: mapped.details,
    };
  }
}

function parseJobError(data: Record<string, unknown>): {
  message: string | null;
  code: string | null;
} {
  const directMessage = toStringOrNull(
    data.error ?? data.errorMessage ?? data.error_message ?? data.lastError,
  );
  const directCode = toStringOrNull(data.errorCode ?? data.error_code);
  const nested = asRecord(data.errorDetail ?? data.details ?? data.result);

  return {
    message:
      directMessage ??
      toStringOrNull(nested?.message ?? nested?.detail ?? nested?.error),
    code: directCode ?? toStringOrNull(nested?.code ?? nested?.errorCode),
  };
}

export async function getSimulationJobStatus(
  jobId: string,
): Promise<SimulationJobStatus | null> {
  const safeJobId = safeId(jobId);
  if (!safeJobId) return null;

  try {
    const { data } = await requestRecruiterBff<unknown>(
      `/backend/jobs/${encodeURIComponent(safeJobId)}`,
      {
        method: 'GET',
      },
    );

    const record = asRecord(data);
    if (!record) return null;

    const parsedJobId =
      toStringOrNull(record.jobId ?? record.id) ?? String(safeJobId);
    const status = toStringOrNull(record.status)?.toLowerCase() ?? null;
    const pollAfterMs = toNumberOrNull(
      record.pollAfterMs ?? record.poll_after_ms,
    );
    const error = parseJobError(record);

    return {
      jobId: parsedJobId,
      status,
      pollAfterMs: pollAfterMs != null && pollAfterMs >= 0 ? pollAfterMs : null,
      errorMessage: error.message,
      errorCode: error.code,
    };
  } catch {
    return null;
  }
}
