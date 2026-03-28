import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { SimulationDetailPreview } from '../../utils/detailUtils';
import type { ScenarioVersionSnapshot } from '../types';
import { syncScenarioVersionSnapshots } from './useSyncScenarioVersionSnapshots';

type Params = {
  detail: SimulationDetailPreview | null;
  fallbackTaskPrompts: Array<Record<string, unknown>> | null;
  pendingRegenerationScenarioVersionId: string | null;
  setScenarioVersionSnapshots: Dispatch<
    SetStateAction<Record<string, ScenarioVersionSnapshot>>
  >;
};

export function useScenarioVersionSnapshotSync({
  detail,
  fallbackTaskPrompts,
  pendingRegenerationScenarioVersionId,
  setScenarioVersionSnapshots,
}: Params) {
  useEffect(() => {
    if (!detail) return;
    setScenarioVersionSnapshots((currentSnapshots) =>
      syncScenarioVersionSnapshots({
        currentSnapshots,
        detail,
        fallbackTaskPrompts,
        pendingRegenerationScenarioVersionId,
      }),
    );
  }, [
    detail,
    fallbackTaskPrompts,
    pendingRegenerationScenarioVersionId,
    setScenarioVersionSnapshots,
  ]);
}
