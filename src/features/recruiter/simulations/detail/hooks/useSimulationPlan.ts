import { useState } from 'react';
import type { SimulationGenerationJob } from '../utils/detail';
import type { SimulationPlan } from '../utils/plan';
import { useSimulationPlanDetailWithJob } from './useSimulationPlan.detailWithJob';
import { useSimulationPlanError } from './useSimulationPlan.error';
import { useSimulationPlanPolling } from './useSimulationPlan.polling';
import { useSimulationPlanQuery } from './useSimulationPlan.query';
import { useSimulationPlanReload } from './useSimulationPlan.reload';

type Params = { simulationId: string };

export function useSimulationPlan({ simulationId }: Params) {
  const [jobStatusHint, setJobStatusHint] =
    useState<SimulationGenerationJob | null>(null);
  const detailQuery = useSimulationPlanQuery(simulationId);
  const { statusCode, error } = useSimulationPlanError(detailQuery.error);
  const { effectiveJob, detailWithJobHint, isGenerating } =
    useSimulationPlanDetailWithJob({
      detail: detailQuery.data,
      jobStatusHint,
    });
  useSimulationPlanPolling({
    simulationId,
    statusCode,
    detailWithJobHint,
    effectiveJob,
    isGenerating,
    setJobStatusHint,
  });
  const reload = useSimulationPlanReload(simulationId);

  const loading =
    detailQuery.isLoading || (detailQuery.isFetching && !detailQuery.data);

  return {
    detail: detailWithJobHint,
    plan: detailWithJobHint?.plan ?? (null as SimulationPlan | null),
    loading,
    error,
    statusCode,
    isGenerating,
    reload,
  };
}
