import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { toStringOrNull } from '@/features/recruiter/simulations/detail/utils/parsing';
import type { SimulationActionResult } from './simulationLifecycle.types';

export const UNSUPPORTED_STATUSES = new Set([404, 405, 501]);
export const TERMINATE_UNSUPPORTED_STATUSES = new Set([405, 501]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
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

export function mapActionError(
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
        message: 'This action is not available yet. Backend support is pending.',
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
