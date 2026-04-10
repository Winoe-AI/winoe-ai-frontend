import { useState } from 'react';
import type { TrialGenerationJob } from '../utils/detailUtils';
import type { TrialPlan } from '../utils/plan';
import { useTrialPlanDetailWithJob } from './useTrialPlan.detailWithJob';
import { useTrialPlanError } from './useTrialPlan.error';
import { useTrialPlanPolling } from './useTrialPlan.polling';
import { useTrialPlanQuery } from './useTrialPlan.query';
import { useTrialPlanReload } from './useTrialPlan.reload';

type Params = { trialId: string };

export function useTrialPlan({ trialId }: Params) {
  const [jobStatusHint, setJobStatusHint] = useState<TrialGenerationJob | null>(
    null,
  );
  const detailQuery = useTrialPlanQuery(trialId);
  const { statusCode, error } = useTrialPlanError(detailQuery.error);
  const { effectiveJob, detailWithJobHint, isGenerating } =
    useTrialPlanDetailWithJob({
      detail: detailQuery.data,
      jobStatusHint,
    });
  useTrialPlanPolling({
    trialId,
    statusCode,
    detailWithJobHint,
    effectiveJob,
    isGenerating,
    setJobStatusHint,
  });
  const reload = useTrialPlanReload(trialId);

  const loading =
    detailQuery.isLoading || (detailQuery.isFetching && !detailQuery.data);

  return {
    detail: detailWithJobHint,
    plan: detailWithJobHint?.plan ?? (null as TrialPlan | null),
    loading,
    error,
    statusCode,
    isGenerating,
    reload,
  };
}
