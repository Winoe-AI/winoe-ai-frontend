import { getSimulationJobStatus } from '@/features/recruiter/api/simulationLifecycleApi';
import { buildActionError } from '../actionError';
import type { Dispatch, SetStateAction } from 'react';
import type { RegenerationPollState, ScenarioVersionSnapshot } from '../types';

export const REGEN_POLL_BACKOFF_MS = [2000, 3000, 5000, 8000, 10000] as const;

type RunParams = {
  pollTarget: RegenerationPollState;
  refreshPlan: () => Promise<void>;
  setPendingRegeneration: Dispatch<
    SetStateAction<RegenerationPollState | null>
  >;
  setActionError: (message: string | null) => void;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
};

export function regenerationPollDelay(
  pollState: RegenerationPollState,
): number {
  const backoffIndex = Math.min(
    pollState.attempt,
    REGEN_POLL_BACKOFF_MS.length - 1,
  );
  if (pollState.pollAfterMs != null && pollState.pollAfterMs > 0) {
    return pollState.pollAfterMs;
  }
  return REGEN_POLL_BACKOFF_MS[backoffIndex];
}

export async function runRegenerationPollAttempt({
  pollTarget,
  refreshPlan,
  setPendingRegeneration,
  setActionError,
  setScenarioVersionSnapshots,
}: RunParams): Promise<void> {
  const job = await getSimulationJobStatus(pollTarget.jobId);
  const jobStatus = job?.status?.toLowerCase() ?? null;
  await refreshPlan();

  if (jobStatus === 'succeeded' || jobStatus === 'completed') {
    setPendingRegeneration(null);
    setScenarioVersionSnapshots((prev) => {
      const current = prev[pollTarget.scenarioVersionId];
      if (!current) return prev;
      return {
        ...prev,
        [pollTarget.scenarioVersionId]: {
          ...current,
          status: 'ready',
          contentAvailability:
            current.contentAvailability === 'canonical'
              ? 'canonical'
              : 'local_only',
        },
      };
    });
    return;
  }

  if (
    jobStatus === 'dead_letter' ||
    jobStatus === 'failed' ||
    jobStatus === 'error'
  ) {
    setPendingRegeneration(null);
    setActionError(
      buildActionError(
        job?.errorMessage,
        'Scenario regeneration failed. Please regenerate and try again.',
      ),
    );
    return;
  }

  setPendingRegeneration((prev) =>
    prev
      ? {
          ...prev,
          attempt: prev.attempt + 1,
          pollAfterMs: job?.pollAfterMs ?? null,
        }
      : prev,
  );
}
