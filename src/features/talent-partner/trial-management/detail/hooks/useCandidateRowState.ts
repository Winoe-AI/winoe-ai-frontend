import { useState } from 'react';
import type { RowState } from './useTypes';

type Updater = (prev: RowState) => RowState;

export function useCandidateRowState(trialId: string) {
  const [bucket, setBucket] = useState<{
    simId: string;
    data: Record<string, RowState>;
  }>({ simId: trialId, data: {} });

  const rows = bucket.simId === trialId ? bucket.data : {};

  const updateRow = (id: string, next: Updater) =>
    setBucket((prev) => {
      const data = prev.simId === trialId ? prev.data : {};
      return {
        simId: trialId,
        data: { ...data, [id]: next(data[id] ?? {}) },
      };
    });

  return { rows, updateRow };
}
