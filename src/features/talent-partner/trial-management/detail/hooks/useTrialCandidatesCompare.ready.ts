import { useEffect, useState } from 'react';

const INITIAL_COMPARE_FETCH_DELAY_MS = 1200;

type Params = {
  enabled: boolean;
  trialId: string;
};

export function useTrialCandidatesCompareReady({ enabled, trialId }: Params) {
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const [readyForTrialId, setReadyForTrialId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || isTestEnvironment) return;
    const timer = window.setTimeout(() => {
      setReadyForTrialId(trialId);
    }, INITIAL_COMPARE_FETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, isTestEnvironment, trialId]);

  if (isTestEnvironment) return enabled;
  return enabled && readyForTrialId === trialId;
}
