import { useQuery } from '@tanstack/react-query';
import { toStatus } from '@/platform/errors/errors';
import { queryKeys } from '@/shared/query';
import { fetchCandidateWinoeReport } from './winoeReport.api';
import {
  WINOE_REPORT_POLL_INTERVAL_MS,
  type WinoeReportFetchOutcome,
} from './winoeReport.types';

const WINOE_REPORT_LOADING_STALE_MS = 10_000;

export function useWinoeReportQuery(candidateSessionId: string) {
  return useQuery({
    queryKey: queryKeys.talentPartner.winoeReportStatus(candidateSessionId),
    queryFn: async ({ signal }) => {
      try {
        return await fetchCandidateWinoeReport(candidateSessionId, signal, {
          skipCache: true,
        });
      } catch (error) {
        if (toStatus(error) === 409) {
          return {
            kind: 'running',
            warnings: [],
          } satisfies WinoeReportFetchOutcome;
        }
        throw error;
      }
    },
    enabled: Boolean(candidateSessionId),
    staleTime: (query) => {
      const data = query.state.data as WinoeReportFetchOutcome | undefined;
      return data?.kind === 'ready'
        ? Number.POSITIVE_INFINITY
        : WINOE_REPORT_LOADING_STALE_MS;
    },
    refetchInterval: (query) => {
      const data = query.state.data as WinoeReportFetchOutcome | undefined;
      return data?.kind === 'running' ? WINOE_REPORT_POLL_INTERVAL_MS : false;
    },
  });
}
