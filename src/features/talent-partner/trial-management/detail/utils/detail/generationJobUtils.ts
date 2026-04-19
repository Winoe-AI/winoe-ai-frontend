import { toNumberOrNull, toStringOrNull } from '../parsingUtils';
import { asRecord, toNonEmptyString } from './parsersUtils';
import type { TrialGenerationJob } from './typesUtils';

function readErrorInfo(value: unknown): {
  message: string | null;
  code: string | null;
} {
  if (typeof value === 'string')
    return { message: toStringOrNull(value), code: null };
  const record = asRecord(value);
  if (!record) return { message: null, code: null };
  const nestedError = asRecord(record.error);
  const message =
    toStringOrNull(record.message ?? record.detail ?? record.errorMessage) ??
    (nestedError
      ? toStringOrNull(
          nestedError.message ?? nestedError.detail ?? nestedError.error,
        )
      : null);
  const code =
    toStringOrNull(record.code ?? record.errorCode) ??
    (nestedError
      ? toStringOrNull(nestedError.code ?? nestedError.errorCode)
      : null);
  return { message, code };
}

export function normalizeGenerationJob(
  raw: unknown,
): TrialGenerationJob | null {
  const record = asRecord(raw);
  if (!record) return null;
  const jobId = toNonEmptyString(record.jobId ?? record.job_id ?? record.id);
  const status =
    toStringOrNull(record.status ?? record.state)?.toLowerCase() ?? null;
  const pollAfterMs = toNumberOrNull(
    record.pollAfterMs ?? record.poll_after_ms,
  );
  const directErrorMessage = toStringOrNull(
    record.errorMessage ?? record.error_message ?? record.lastError,
  );
  const directErrorCode = toStringOrNull(
    record.errorCode ?? record.error_code ?? record.code,
  );
  const nestedError = readErrorInfo(record.error ?? record.last_error);
  const errorMessage =
    directErrorMessage ?? nestedError.message ?? toStringOrNull(record.error);
  const errorCode = directErrorCode ?? nestedError.code;
  if (!jobId && !status && pollAfterMs == null && !errorMessage && !errorCode)
    return null;
  return {
    jobId,
    status,
    pollAfterMs: pollAfterMs != null && pollAfterMs >= 0 ? pollAfterMs : null,
    errorMessage,
    errorCode,
  };
}

export function readGenerationJob(
  raw: Record<string, unknown>,
  scenario: Record<string, unknown> | null,
): TrialGenerationJob | null {
  const generationFailure = asRecord(
    raw.generationFailure ?? raw.generation_failure,
  );
  const explicitJob =
    normalizeGenerationJob(raw.scenarioJob ?? raw.scenario_job) ??
    normalizeGenerationJob(raw.generationJob ?? raw.generation_job) ??
    normalizeGenerationJob(generationFailure) ??
    normalizeGenerationJob(raw.job) ??
    normalizeGenerationJob(scenario?.job ?? scenario?.scenarioJob);
  if (explicitJob) return explicitJob;
  return normalizeGenerationJob({
    jobId: raw.jobId ?? raw.job_id ?? scenario?.jobId ?? scenario?.job_id,
    status:
      raw.jobStatus ??
      raw.job_status ??
      scenario?.jobStatus ??
      scenario?.job_status,
    pollAfterMs:
      raw.pollAfterMs ??
      raw.poll_after_ms ??
      scenario?.pollAfterMs ??
      scenario?.poll_after_ms,
    error:
      raw.jobError ??
      raw.job_error ??
      scenario?.jobError ??
      scenario?.job_error,
    errorCode:
      raw.jobErrorCode ??
      raw.job_error_code ??
      generationFailure?.code ??
      generationFailure?.errorCode ??
      scenario?.jobErrorCode ??
      scenario?.job_error_code,
    errorMessage:
      generationFailure?.error ??
      generationFailure?.message ??
      generationFailure?.errorMessage ??
      generationFailure?.lastError,
  });
}
