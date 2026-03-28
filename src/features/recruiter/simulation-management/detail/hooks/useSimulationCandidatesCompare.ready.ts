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
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const [readyForSimulationId, setReadyForSimulationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!enabled || isTestEnvironment) return;
    const timer = window.setTimeout(() => {
      setReadyForSimulationId(simulationId);
    }, INITIAL_COMPARE_FETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, isTestEnvironment, simulationId]);

  if (isTestEnvironment) return enabled;
  return enabled && readyForSimulationId === simulationId;
}
