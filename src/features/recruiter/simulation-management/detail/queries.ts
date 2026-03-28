import { recruiterBffClient } from '@/platform/api-client/client';
import {
  listSimulationCandidateCompare,
  listSimulationCandidates,
} from '@/features/recruiter/api';
import {
  normalizeSimulationDetailPreview,
  type SimulationDetailPreview,
} from './utils/detailUtils';
import type { CandidateCompareRow } from '@/features/recruiter/api/candidatesCompareApi';
import type { CandidateSession } from '@/features/recruiter/types';

export const SIMULATION_DETAIL_STALE_TIME_MS = 5 * 60 * 1000;
export const SIMULATION_CANDIDATES_STALE_TIME_MS = 60_000;
export const SIMULATION_COMPARE_STALE_TIME_MS = 5 * 60 * 1000;

export async function fetchSimulationDetailQuery(
  simulationId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<SimulationDetailPreview> {
  const data = await recruiterBffClient.get<unknown>(
    `/simulations/${simulationId}`,
    {
      cache: 'no-store',
      signal,
      skipCache,
      cacheTtlMs: SIMULATION_DETAIL_STALE_TIME_MS,
      dedupeKey: `simulation-detail-${simulationId}`,
    },
  );
  return normalizeSimulationDetailPreview(data);
}

export async function fetchSimulationCandidatesQuery(
  simulationId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<CandidateSession[]> {
  return listSimulationCandidates(simulationId, {
    cache: 'no-store',
    signal,
    skipCache,
    cacheTtlMs: SIMULATION_CANDIDATES_STALE_TIME_MS,
    dedupeKey: `simulation-candidates-${simulationId}`,
  });
}

export async function fetchSimulationCompareQuery(
  simulationId: string,
  signal?: AbortSignal,
  skipCache = false,
): Promise<CandidateCompareRow[]> {
  return listSimulationCandidateCompare(simulationId, {
    cache: 'no-store',
    signal,
    skipCache,
    cacheTtlMs: SIMULATION_COMPARE_STALE_TIME_MS,
    dedupeKey: `simulation-candidates-compare-${simulationId}`,
  });
}
