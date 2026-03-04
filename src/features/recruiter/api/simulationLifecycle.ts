import { toStatus, toUserMessage } from '@/lib/errors/errors';
import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/recruiter/simulations/detail/utils/parsing';
import { requestRecruiterBff } from './requestRecruiterBff';
import { safeId } from './simUtils';

export type SimulationActionResult = {
  ok: boolean;
  status: number | null;
  message: string | null;
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

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function mapActionError(
  error: unknown,
  fallback: string,
): SimulationActionResult {
  const status = toStatus(error);
  if (status !== null && UNSUPPORTED_STATUSES.has(status)) {
    return {
      ok: false,
      status,
      unsupported: true,
      message: 'This action is not available yet. Backend support is pending.',
    };
  }

  if (status === 403) {
    return {
      ok: false,
      status,
      message: "You don't have access to perform this action.",
    };
  }

  if (status === 404) {
    return { ok: false, status, message: 'Simulation not found.' };
  }

  return {
    ok: false,
    status,
    message: toUserMessage(error, fallback, { includeDetail: false }),
  };
}

async function tryPostWithFallback(
  paths: string[],
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<SimulationActionResult> {
  let lastError: unknown = null;

  for (const path of paths) {
    try {
      const { data } = await requestRecruiterBff<unknown>(path, {
        method: 'POST',
        body,
      });
      return {
        ok: true,
        status: 200,
        message: null,
        data,
      };
    } catch (error) {
      lastError = error;
      const status = toStatus(error);
      if (status !== null && UNSUPPORTED_STATUSES.has(status)) continue;
      return mapActionError(error, fallbackError);
    }
  }

  return mapActionError(lastError, fallbackError);
}

export async function activateSimulationInviting(
  simulationId: string | number,
): Promise<SimulationActionResult> {
  const id = safeId(simulationId);
  if (!id) {
    return { ok: false, status: 400, message: 'Simulation ID is required.' };
  }

  try {
    const { data } = await requestRecruiterBff<unknown>(
      `/backend/simulations/${encodeURIComponent(id)}/activate`,
      {
        method: 'POST',
        body: { confirm: true },
      },
    );
    return { ok: true, status: 200, message: null, data };
  } catch (error) {
    if (toStatus(error) === 404) {
      return { ok: false, status: 404, message: 'Simulation not found.' };
    }
    return mapActionError(error, 'Unable to approve simulation.');
  }
}

export async function regenerateSimulationScenario(
  simulationId: string | number,
): Promise<SimulationActionResult> {
  const id = safeId(simulationId);
  if (!id) {
    return { ok: false, status: 400, message: 'Simulation ID is required.' };
  }

  return tryPostWithFallback(
    [
      `/backend/simulations/${encodeURIComponent(id)}/scenario/regenerate`,
      `/backend/simulations/${encodeURIComponent(id)}/regenerate`,
    ],
    { confirm: true, reason: 'regenerate' },
    'Unable to regenerate scenario.',
  );
}

export async function retrySimulationGeneration(
  simulationId: string | number,
): Promise<SimulationActionResult> {
  const id = safeId(simulationId);
  if (!id) {
    return { ok: false, status: 400, message: 'Simulation ID is required.' };
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
