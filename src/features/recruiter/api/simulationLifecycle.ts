import { toStatus, toUserMessage } from '@/lib/errors/errors';
import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/recruiter/simulations/detail/utils/parsing';
import type { TerminateSimulationResponse } from './types';
import { requestRecruiterBff } from './requestRecruiterBff';
import { safeId } from './simUtils';

export type SimulationActionResult = {
  ok: boolean;
  statusCode?: number | null;
  message?: string | null;
  unsupported?: boolean;
  data?: unknown;
};

export type SimulationJobStatus = {
  jobId: string;
  status: string | null;
  pollAfterMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
};

const UNSUPPORTED_STATUSES = new Set([404, 405, 501]);
const TERMINATE_UNSUPPORTED_STATUSES = new Set([405, 501]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function mapActionError(
  error: unknown,
  fallback: string,
  opts?: { unsupportedStatuses?: Set<number> },
): SimulationActionResult {
  try {
    const statusCode = toStatus(error);
    const unsupported = opts?.unsupportedStatuses ?? UNSUPPORTED_STATUSES;
    if (statusCode !== null && unsupported.has(statusCode)) {
      return {
        ok: false,
        statusCode,
        unsupported: true,
        message:
          'This action is not available yet. Backend support is pending.',
      };
    }

    if (statusCode === 403) {
      return {
        ok: false,
        statusCode,
        message: "You don't have access to perform this action.",
      };
    }

    if (statusCode === 404) {
      return { ok: false, statusCode, message: 'Simulation not found.' };
    }

    return {
      ok: false,
      statusCode,
      message: toUserMessage(error, fallback, { includeDetail: false }),
    };
  } catch {
    return {
      ok: false,
      statusCode: null,
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
  const toId = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return toStringOrNull(value);
  };
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
          data,
        };
      } catch (error) {
        lastError = error;
        const statusCode = toStatus(error);
        if (statusCode !== null && UNSUPPORTED_STATUSES.has(statusCode))
          continue;
        return mapActionError(error, fallbackError);
      }
    }

    return mapActionError(lastError, fallbackError);
  } catch {
    return {
      ok: false,
      statusCode: null,
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
    return { ok: true, statusCode: 200, message: null, data };
  } catch (error) {
    return mapActionError(error, 'Unable to approve simulation.');
  }
}

export async function regenerateSimulationScenario(
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
        `/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`,
        `/backend/simulations/${encodeURIComponent(id)}/regenerate`,
      ],
      { confirm: true, reason: 'regenerate' },
      'Unable to regenerate scenario.',
    );
  } catch {
    return {
      ok: false,
      statusCode: null,
      message: 'Unable to regenerate scenario.',
    };
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
      },
    );

    const normalized = toTerminateResponse(data, id);
    const terminated = isTerminatedStatus(normalized.status);
    return {
      ok: terminated,
      statusCode: 200,
      message: terminated ? null : 'Unable to terminate simulation.',
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
