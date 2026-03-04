import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { recruiterBffClient } from '@/lib/api/client';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { getSimulationJobStatus } from '@/features/recruiter/api';
import {
  isPreviewGenerating,
  normalizeSimulationDetailPreview,
  type SimulationGenerationJob,
  type SimulationDetailPreview,
} from '../utils/detail';
import type { SimulationPlan } from '../utils/plan';

type Params = { simulationId: string };

const POLL_BACKOFF_MS = [2000, 3000, 5000, 8000, 10000] as const;

type LoadOptions = {
  skipCache?: boolean;
  silent?: boolean;
};

export function useSimulationPlan({ simulationId }: Params) {
  const [detail, setDetail] = useState<SimulationDetailPreview | null>(null);
  const [jobStatusHint, setJobStatusHint] =
    useState<SimulationGenerationJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);

  const mountedRef = useRef(true);
  const pollTimerRef = useRef<number | null>(null);
  const pollAttemptRef = useRef(0);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current != null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPollTimer();
    };
  }, [clearPollTimer]);

  const loadPlan = useCallback(
    async (opts?: LoadOptions) => {
      const silent = opts?.silent === true;
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await recruiterBffClient.get<unknown>(
          `/simulations/${simulationId}`,
          {
            cache: 'no-store',
            skipCache: opts?.skipCache,
            cacheTtlMs: 12000,
          },
        );

        if (!mountedRef.current) return;
        const normalized = normalizeSimulationDetailPreview(data);
        setDetail(normalized);
        if (!normalized.generationJob?.jobId) {
          setJobStatusHint(null);
        }
        setStatusCode(null);
        if (!silent) setError(null);
      } catch (caught: unknown) {
        if (!mountedRef.current) return;

        const status = toStatus(caught);
        setStatusCode(status);

        if (status === 404) {
          setError('Simulation not found.');
        } else if (status === 403) {
          setError("You don't have access to this simulation.");
        } else {
          setError(
            toUserMessage(caught, 'Failed to load simulation details.', {
              includeDetail: false,
            }),
          );
        }
      } finally {
        if (!silent && mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [simulationId],
  );

  useEffect(() => {
    pollAttemptRef.current = 0;
    clearPollTimer();
    void loadPlan();
    return clearPollTimer;
  }, [clearPollTimer, loadPlan]);

  const isGenerating = useMemo(() => isPreviewGenerating(detail), [detail]);
  const effectiveJob = useMemo(() => {
    if (!detail) return jobStatusHint;
    if (!detail.generationJob) return jobStatusHint;
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
    if (!detail || !effectiveJob || !detail.generationJob) return detail;
    return { ...detail, generationJob: effectiveJob };
  }, [detail, effectiveJob]);

  useEffect(() => {
    clearPollTimer();

    if (!detail || detail.hasJobFailure || !isGenerating) {
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
        const jobId = effectiveJob?.jobId ?? detail.generationJob?.jobId;
        if (jobId) {
          const job = await getSimulationJobStatus(jobId);
          if (job && mountedRef.current) {
            setJobStatusHint({
              jobId: job.jobId,
              status: job.status,
              pollAfterMs: job.pollAfterMs,
              errorMessage: job.errorMessage,
              errorCode: job.errorCode,
            });
          }
        }
        await loadPlan({ skipCache: true, silent: true });
      })();
    }, delayMs);

    return clearPollTimer;
  }, [clearPollTimer, detail, effectiveJob, isGenerating, loadPlan]);

  return {
    detail: detailWithJobHint,
    plan: detailWithJobHint?.plan ?? (null as SimulationPlan | null),
    loading,
    error,
    statusCode,
    isGenerating,
    reload: () => loadPlan({ skipCache: true }),
  };
}
