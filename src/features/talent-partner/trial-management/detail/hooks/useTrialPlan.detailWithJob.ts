import { useMemo } from 'react';
import {
  isPreviewGenerating,
  type TrialDetailPreview,
  type TrialGenerationJob,
} from '../utils/detailUtils';

type UseTrialPlanDetailWithJobArgs = {
  detail: TrialDetailPreview | undefined;
  jobStatusHint: TrialGenerationJob | null;
};

export function useTrialPlanDetailWithJob({
  detail,
  jobStatusHint,
}: UseTrialPlanDetailWithJobArgs) {
  const effectiveJob = useMemo(() => {
    if (!detail?.generationJob) return null;
    if (detail.generationJob.pollAfterMs != null) return detail.generationJob;
    if (!jobStatusHint) return detail.generationJob;
    if (jobStatusHint.jobId !== detail.generationJob.jobId) {
      return detail.generationJob;
    }
    return {
      ...detail.generationJob,
      pollAfterMs:
        jobStatusHint.pollAfterMs ?? detail.generationJob.pollAfterMs,
      status: jobStatusHint.status ?? detail.generationJob.status,
      errorMessage:
        jobStatusHint.errorMessage ?? detail.generationJob.errorMessage,
      errorCode: jobStatusHint.errorCode ?? detail.generationJob.errorCode,
    };
  }, [detail, jobStatusHint]);

  const detailWithJobHint = useMemo(() => {
    if (!detail || !effectiveJob || !detail.generationJob) {
      return detail ?? null;
    }
    return { ...detail, generationJob: effectiveJob };
  }, [detail, effectiveJob]);

  const isGenerating = useMemo(
    () => isPreviewGenerating(detailWithJobHint),
    [detailWithJobHint],
  );

  return { effectiveJob, detailWithJobHint, isGenerating };
}
