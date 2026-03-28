import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { SimulationDetailPreview } from '../../utils/detailUtils';
import type { RegenerationPollState, ScenarioVersionSnapshot } from '../types';
import {
  regenerationPollDelay,
  runRegenerationPollAttempt,
} from './useRegenerationPollRun';

type Params = {
  simulationId: string;
  detail: SimulationDetailPreview | null;
  pendingRegeneration: RegenerationPollState | null;
  setPendingRegeneration: Dispatch<
    SetStateAction<RegenerationPollState | null>
  >;
  refreshPlan: () => Promise<void>;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
};

export function useScenarioRegenerationPoll({
  simulationId,
  detail,
  pendingRegeneration,
  setPendingRegeneration,
  refreshPlan,
  setActionError,
  setScenarioVersionSnapshots,
}: Params) {
  const regenerationTimerRef = useRef<number | null>(null);
  const clearRegenerationTimer = useCallback(() => {
    if (regenerationTimerRef.current == null) return;
    window.clearTimeout(regenerationTimerRef.current);
    regenerationTimerRef.current = null;
  }, []);

  useEffect(() => {
    return clearRegenerationTimer;
  }, [clearRegenerationTimer]);

  useEffect(() => {
    clearRegenerationTimer();
  }, [clearRegenerationTimer, simulationId]);

  useEffect(() => {
    if (!pendingRegeneration || !detail) return;
    const regeneratedVersionId = pendingRegeneration.scenarioVersionId;
    const activeMatches =
      detail.activeScenarioVersionId === regeneratedVersionId;
    const pendingMatches =
      detail.pendingScenarioVersionId === regeneratedVersionId;
    if (!activeMatches && !pendingMatches) return;
    if (!pendingMatches && activeMatches) setPendingRegeneration(null);
  }, [detail, pendingRegeneration, setPendingRegeneration]);

  useEffect(() => {
    clearRegenerationTimer();
    if (!pendingRegeneration) return;

    const delayMs = regenerationPollDelay(pendingRegeneration);
    const pollTarget = pendingRegeneration;

    regenerationTimerRef.current = window.setTimeout(() => {
      void (async () => {
        await runRegenerationPollAttempt({
          pollTarget,
          refreshPlan,
          setPendingRegeneration,
          setActionError,
          setScenarioVersionSnapshots,
        });
      })();
    }, delayMs);

    return clearRegenerationTimer;
  }, [
    clearRegenerationTimer,
    pendingRegeneration,
    refreshPlan,
    setActionError,
    setPendingRegeneration,
    setScenarioVersionSnapshots,
  ]);
}
