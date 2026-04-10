import { talentPartnerBffClient } from '@/platform/api-client/client';
import type { WinoeReportFetchOutcome } from './winoeReport.types';
import { normalizeWinoeReportPayload } from './winoeReport.normalizePayload';

export { normalizeWinoeReportPayload };

export async function fetchCandidateWinoeReport(
  candidateSessionId: string,
  signal?: AbortSignal,
  options?: { skipCache?: boolean },
): Promise<WinoeReportFetchOutcome> {
  const encodedId = encodeURIComponent(candidateSessionId);
  const payload = await talentPartnerBffClient.get<unknown>(
    `/candidate_sessions/${encodedId}/winoe_report`,
    {
      cache: 'no-store',
      signal,
      skipCache: options?.skipCache,
      cacheTtlMs: 10_000,
      dedupeKey: `winoe-report-status-${candidateSessionId}`,
    },
  );
  return normalizeWinoeReportPayload(payload);
}

export async function generateCandidateWinoeReport(
  candidateSessionId: string,
): Promise<void> {
  const encodedId = encodeURIComponent(candidateSessionId);
  await talentPartnerBffClient.post<unknown>(
    `/candidate_sessions/${encodedId}/winoe_report/generate`,
    {},
    {
      cache: 'no-store',
      skipCache: true,
      disableDedupe: true,
      cacheTtlMs: 0,
    },
  );
}
