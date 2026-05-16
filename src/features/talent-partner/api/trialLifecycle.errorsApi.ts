import { toStatus, toUserMessage } from '@/platform/errors/errors';
import { toStringOrNull } from '@/features/talent-partner/trial-management/detail/utils/parsingUtils';
import type { TrialActionResult } from './trialLifecycle.typesApi';

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

function sanitizeTalentPartnerActionMessage(
  message: string | null | undefined,
  fallback: string,
): string {
  const raw =
    typeof message === 'string' && message.trim() ? message.trim() : fallback;
  if (/\bapi\.github\.com\b/i.test(raw)) return fallback;
  if (/GitHub API error/i.test(raw)) return fallback;
  return raw;
}

export function mapActionError(
  error: unknown,
  fallback: string,
  opts?: { unsupportedStatuses?: Set<number> },
): TrialActionResult {
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
        message: 'Trial not found.',
      };
    }

    if (errorCode === 'SCENARIO_APPROVAL_PENDING') {
      return {
        ok: false,
        statusCode,
        errorCode,
        details,
        message:
          'A regenerated Project Brief is waiting for your approval. Open this Trial, select the pending scenario version, approve that brief, then return here to approve the Trial for inviting.',
      };
    }

    return {
      ok: false,
      statusCode,
      errorCode,
      details,
      message: sanitizeTalentPartnerActionMessage(
        toUserMessage(error, fallback, { includeDetail: false }),
        fallback,
      ),
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
