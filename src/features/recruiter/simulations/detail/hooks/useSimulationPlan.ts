import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { queryKeys } from '@/shared/query';
import { getSimulationJobStatus } from '@/features/recruiter/api/simulationLifecycle';
import {
  isPreviewGenerating,
  type SimulationGenerationJob,
} from '../utils/detail';
import {
  fetchSimulationDetailQuery,
  SIMULATION_DETAIL_STALE_TIME_MS,
} from '../queries';
import type { SimulationPlan } from '../utils/plan';

type Params = { simulationId: string };

const POLL_BACKOFF_MS = [2000, 3000, 5000, 8000, 10000] as const;

export function useSimulationPlan({ simulationId }: Params) {
  const queryClient = useQueryClient();
  const [jobStatusHint, setJobStatusHint] =
    useState<SimulationGenerationJob | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const pollAttemptRef = useRef(0);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const detailQuery = useQuery({
    queryKey: queryKeys.recruiter.simulationDetail(simulationId),
    queryFn: ({ signal }) =>
      fetchSimulationDetailQuery(simulationId, signal, false),
    enabled: Boolean(simulationId),
    staleTime: SIMULATION_DETAIL_STALE_TIME_MS,
  });

  const statusCode = useMemo(() => {
    if (!detailQuery.error) return null;
    return toStatus(detailQuery.error);
  }, [detailQuery.error]);

  const error = useMemo(() => {
    if (!detailQuery.error) return null;
    if (statusCode === 404) return 'Simulation not found.';
    if (statusCode === 403) return "You don't have access to this simulation.";
    return toUserMessage(
      detailQuery.error,
      'Failed to load simulation details.',
      {
        includeDetail: false,
      },
    );
  }, [detailQuery.error, statusCode]);

  useEffect(() => {
    pollAttemptRef.current = 0;
    clearPollTimer();
  }, [clearPollTimer, simulationId]);

  const effectiveJob = useMemo(() => {
    const detail = detailQuery.data;
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
  }, [detailQuery.data, jobStatusHint]);

  const detailWithJobHint = useMemo(() => {
    const detail = detailQuery.data;
    if (!detail || !effectiveJob || !detail.generationJob)
      return detail ?? null;
    return { ...detail, generationJob: effectiveJob };
  }, [detailQuery.data, effectiveJob]);

  const isGenerating = useMemo(
    () => isPreviewGenerating(detailWithJobHint),
    [detailWithJobHint],
  );

  useEffect(() => {
    clearPollTimer();

    if (
      statusCode === 403 ||
      statusCode === 404 ||
      !detailWithJobHint ||
      detailWithJobHint.hasJobFailure ||
      !isGenerating
    ) {
      pollAttemptRef.current = 0;
      return;
    }

    const pollAfterMs = effectiveJob?.pollAfterMs;
    const backoffIndex = Math.min(
      pollAttemptRef.current,
      POLL_BACKOFF_MS.length - 1,
    );
    const delayMs =
      typeof pollAfterMs === 'number' && pollAfterMs > 0
        ? pollAfterMs
        : POLL_BACKOFF_MS[backoffIndex];

    pollTimerRef.current = window.setTimeout(() => {
      pollAttemptRef.current += 1;
      void (async () => {
        const jobId =
          effectiveJob?.jobId ?? detailWithJobHint.generationJob?.jobId;
        if (jobId) {
          try {
            const job = await getSimulationJobStatus(jobId);
            if (job) {
              setJobStatusHint({
                jobId: job.jobId,
                status: job.status,
                pollAfterMs: job.pollAfterMs,
                errorMessage: job.errorMessage,
                errorCode: job.errorCode,
              });
            }
          } catch {}
        }
        await queryClient.fetchQuery({
          queryKey: queryKeys.recruiter.simulationDetail(simulationId),
          queryFn: ({ signal }) =>
            fetchSimulationDetailQuery(simulationId, signal, true),
          staleTime: 0,
        });
      })();
    }, delayMs);

    return clearPollTimer;
  }, [
    clearPollTimer,
    detailWithJobHint,
    effectiveJob,
    isGenerating,
    queryClient,
    simulationId,
    statusCode,
  ]);

  const reload = useCallback(async () => {
    const queryKey = queryKeys.recruiter.simulationDetail(simulationId);
    await queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
    await queryClient.fetchQuery({
      queryKey,
      queryFn: ({ signal }) =>
        fetchSimulationDetailQuery(simulationId, signal, true),
      staleTime: 0,
    });
  }, [queryClient, simulationId]);

  useEffect(() => clearPollTimer, [clearPollTimer]);

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
