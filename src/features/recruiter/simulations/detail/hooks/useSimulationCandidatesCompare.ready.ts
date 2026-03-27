import { useEffect, useState } from 'react';

const INITIAL_COMPARE_FETCH_DELAY_MS = 1200;

type Params = {
  enabled: boolean;
  simulationId: string;
};

export function useSimulationCandidatesCompareReady({
  enabled,
  simulationId,
}: Params) {
  const [compareReady, setCompareReady] = useState(
    process.env.NODE_ENV === 'test',
  );

  useEffect(() => {
    if (!enabled) {
      setCompareReady(false);
      return;
    }
    if (process.env.NODE_ENV === 'test') {
      setCompareReady(true);
      return;
    }
    const timer = window.setTimeout(() => {
      setCompareReady(true);
    }, INITIAL_COMPARE_FETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, simulationId]);

  return compareReady;
}
