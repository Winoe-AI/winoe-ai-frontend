import { safeId, talentPartnerBffClient } from './trialUtilsApi';
import {
  normalizeCandidateCompareList,
  type CandidateCompareRow,
} from './candidatesCompareNormalizeApi';

export type CandidateCompareListOptions = {
  signal?: AbortSignal;
  cache?: RequestCache;
  skipCache?: boolean;
  cacheTtlMs?: number;
  dedupeKey?: string;
  disableDedupe?: boolean;
};

export async function listTrialCandidateCompare(
  trialId: string | number,
  options?: CandidateCompareListOptions,
): Promise<CandidateCompareRow[]> {
  const id = safeId(trialId);
  if (!id) return [];

  const payload = await talentPartnerBffClient.get<unknown>(
    `/trials/${encodeURIComponent(id)}/candidates/compare`,
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
  CandidateCompareWinoeReportStatus,
  CandidateCompareDayCompletion,
} from './candidatesCompareNormalizeApi';
export type { CandidateCompareRow } from './candidatesCompareNormalizeApi';
