import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { getTrialJobStatus } from '@/features/talent-partner/api/trialLifecycleApi';
import type {
  TrialDetailPreview,
  TrialGenerationJob,
} from '../utils/detailUtils';
import { fetchTrialDetailQuery } from '../queries';

const POLL_BACKOFF_MS = [2000, 3000, 5000, 8000, 10000] as const;

type UseTrialPlanPollingArgs = {
  trialId: string;
  statusCode: number | null;
  detailWithJobHint: TrialDetailPreview | null;
  effectiveJob: TrialGenerationJob | null;
  isGenerating: boolean;
  setJobStatusHint: Dispatch<SetStateAction<TrialGenerationJob | null>>;
};

export function useTrialPlanPolling({
  trialId,
  statusCode,
  detailWithJobHint,
  effectiveJob,
  isGenerating,
  setJobStatusHint,
}: UseTrialPlanPollingArgs) {
  const queryClient = useQueryClient();
  const pollTimerRef = useRef<number | null>(null);
  const pollAttemptRef = useRef(0);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current == null) return;
    window.clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  useEffect(() => {
    pollAttemptRef.current = 0;
    clearPollTimer();
  }, [clearPollTimer, trialId]);

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

    const backoffIndex = Math.min(
      pollAttemptRef.current,
      POLL_BACKOFF_MS.length - 1,
    );
    const delayMs =
      typeof effectiveJob?.pollAfterMs === 'number' &&
      effectiveJob.pollAfterMs > 0
        ? effectiveJob.pollAfterMs
        : POLL_BACKOFF_MS[backoffIndex];

    pollTimerRef.current = window.setTimeout(() => {
      pollAttemptRef.current += 1;
      void (async () => {
        const jobId =
          effectiveJob?.jobId ?? detailWithJobHint.generationJob?.jobId;
        if (jobId) {
          try {
            const job = await getTrialJobStatus(jobId);
            if (job) setJobStatusHint(job);
          } catch {}
        }
        await queryClient.fetchQuery({
          queryKey: queryKeys.talentPartner.trialDetail(trialId),
          queryFn: ({ signal }) => fetchTrialDetailQuery(trialId, signal, true),
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
    setJobStatusHint,
    trialId,
    statusCode,
  ]);

  useEffect(() => clearPollTimer, [clearPollTimer]);
}
