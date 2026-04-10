import { toStringOrNull } from '@/features/talent-partner/trial-management/detail/utils/parsingUtils';
import type { TerminateTrialResponse } from './typesApi';
export {
  toScenarioApproveResponse,
  toScenarioPatchResponse,
  toScenarioRegenerateResponse,
} from './trialLifecycle.normalizers.scenarioApi';

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function toId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return toStringOrNull(value);
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

export function isTerminatedStatus(status: string | null | undefined): boolean {
  return status?.toLowerCase() === 'terminated';
}

export function toTerminateResponse(
  data: unknown,
  fallbackTrialId: string,
): TerminateTrialResponse {
  const record = asRecord(data);
  const status = toTerminateStatus(record?.status);
  const trialId =
    toId(record?.trialId ?? record?.trial_id ?? record?.id) ?? fallbackTrialId;
  return {
    trialId,
    status,
    cleanupJobIds: record ? toCleanupJobIds(record) : undefined,
  };
}

export function maybeIdempotentTerminateFromError(
  error: unknown,
  trialId: string,
): TerminateTrialResponse | null {
  const errorRecord = asRecord(error);
  const payload = errorRecord?.details ?? errorRecord?.data ?? error;
  const payloadRecord = asRecord(payload);
  const explicitStatus = toStringOrNull(payloadRecord?.status);
  if (!isTerminatedStatus(explicitStatus)) return null;
  return toTerminateResponse(payload, trialId);
}

export function parseJobError(data: Record<string, unknown>): {
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
