import {
  toNumberOrNull,
  toStringOrNull,
} from '@/features/recruiter/simulations/detail/utils/parsing';
import { requestRecruiterBff } from './requestRecruiterBff';
import { safeId } from './simUtils';
import { asRecord, parseJobError } from './simulationLifecycle.normalizers';
import type { SimulationJobStatus } from './simulationLifecycle.types';

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

    const parsedJobId = toStringOrNull(record.jobId ?? record.id) ?? safeJobId;
    const status = toStringOrNull(record.status)?.toLowerCase() ?? null;
    const pollAfterMs = toNumberOrNull(record.pollAfterMs ?? record.poll_after_ms);
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
