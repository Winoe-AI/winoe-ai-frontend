import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/talent-partner/trial-management/detail/utils/parsingUtils';
import { requestTalentPartnerBff } from './requestTalentPartnerBffApi';
import { safeId } from './trialUtilsApi';
import { asRecord, parseJobError } from './trialLifecycle.normalizersApi';
import type { TrialJobStatus } from './trialLifecycle.typesApi';

export async function getTrialJobStatus(
  jobId: string,
): Promise<TrialJobStatus | null> {
  const safeJobId = safeId(jobId);
  if (!safeJobId) return null;

  try {
    const { data } = await requestTalentPartnerBff<unknown>(
      `/backend/jobs/${encodeURIComponent(safeJobId)}`,
      {
        method: 'GET',
      },
    );

    const record = asRecord(data);
    if (!record) return null;

    const parsedJobId = toStringOrNull(record.jobId ?? record.id) ?? safeJobId;
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
