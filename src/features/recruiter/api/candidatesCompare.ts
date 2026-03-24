import { safeId, recruiterBffClient } from './simUtils';
import {
  normalizeCandidateCompareList,
  type CandidateCompareRow,
} from './candidatesCompareNormalize';

export type CandidateCompareListOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

export async function listSimulationCandidateCompare(
  simulationId: string | number,
  options?: CandidateCompareListOptions,
): Promise<CandidateCompareRow[]> {
  const id = safeId(simulationId);
  if (!id) return [];

  const payload = await recruiterBffClient.get<unknown>(
    `/simulations/${encodeURIComponent(id)}/candidates/compare`,
    {
      cache: options?.cache ?? 'no-store',
      signal: options?.signal,
      skipCache: options?.skipCache,
      cacheTtlMs: options?.cacheTtlMs ?? 6000,
      dedupeKey: options?.dedupeKey,
      disableDedupe: options?.disableDedupe,
    },
  );

  return normalizeCandidateCompareList(payload);
}

export type {
  CandidateCompareFitProfileStatus,
  CandidateCompareDayCompletion,
} from './candidatesCompareNormalize';
export type { CandidateCompareRow } from './candidatesCompareNormalize';
