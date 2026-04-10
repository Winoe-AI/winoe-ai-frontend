import { talentPartnerBffClient } from '@/platform/api-client/client';
import {
  listTrialCandidateCompare,
  listTrialCandidates,
} from '@/features/talent-partner/api';
import {
  normalizeTrialDetailPreview,
  type TrialDetailPreview,
} from './utils/detailUtils';
import type { CandidateCompareRow } from '@/features/talent-partner/api/candidatesCompareApi';
import type { CandidateSession } from '@/features/talent-partner/types';

export const TRIAL_DETAIL_STALE_TIME_MS = 5 * 60 * 1000;
export const TRIAL_CANDIDATES_STALE_TIME_MS = 60_000;
export const TRIAL_COMPARE_STALE_TIME_MS = 5 * 60 * 1000;

export async function fetchTrialDetailQuery(
  trialId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<TrialDetailPreview> {
  const data = await talentPartnerBffClient.get<unknown>(`/trials/${trialId}`, {
    cache: 'no-store',
    signal,
    skipCache,
    cacheTtlMs: TRIAL_DETAIL_STALE_TIME_MS,
    dedupeKey: `trial-detail-${trialId}`,
  });
  return normalizeTrialDetailPreview(data);
}

export async function fetchTrialCandidatesQuery(
  trialId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<CandidateSession[]> {
  return listTrialCandidates(trialId, {
    cache: 'no-store',
    signal,
    skipCache,
    cacheTtlMs: TRIAL_CANDIDATES_STALE_TIME_MS,
    dedupeKey: `trial-candidates-${trialId}`,
  });
}

export async function fetchTrialCompareQuery(
  trialId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<CandidateCompareRow[]> {
  return listTrialCandidateCompare(trialId, {
    cache: 'no-store',
    signal,
    skipCache,
    cacheTtlMs: TRIAL_COMPARE_STALE_TIME_MS,
    dedupeKey: `trial-candidates-compare-${trialId}`,
  });
}
