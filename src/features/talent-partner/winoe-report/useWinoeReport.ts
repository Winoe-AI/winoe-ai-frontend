import { useMemo } from 'react';
import { INITIAL_WINOE_REPORT_STATE, errorState } from './winoeReport.state';
import {
  stateFromLoadError,
  stateFromOutcome,
} from './winoeReport.stateResolve';
import { useWinoeReportGenerate } from './useWinoeReportGenerate';
import { useWinoeReportQuery } from './useWinoeReportQuery';
import { useWinoeReportRefresh } from './useWinoeReportRefresh';

export function useWinoeReport(candidateSessionId: string) {
  const refreshStatusNow = useWinoeReportRefresh(candidateSessionId);
  const winoeReportQuery = useWinoeReportQuery(candidateSessionId);
  const { generatePending, stateOverride, generate, reload } =
    useWinoeReportGenerate({ candidateSessionId, refreshStatusNow });

  const state = useMemo(() => {
    if (!candidateSessionId) {
      return errorState('Candidate session ID is missing.');
    }
    if (stateOverride) return stateOverride;
    if (winoeReportQuery.data) return stateFromOutcome(winoeReportQuery.data);
    if (winoeReportQuery.error)
      return stateFromLoadError(winoeReportQuery.error);
    return INITIAL_WINOE_REPORT_STATE;
  }, [
    candidateSessionId,
    winoeReportQuery.data,
    winoeReportQuery.error,
    stateOverride,
  ]);

  return {
    state,
    loading:
      !stateOverride &&
      (winoeReportQuery.isLoading ||
        (winoeReportQuery.isFetching && !winoeReportQuery.data)),
    generatePending,
    generate,
    reload,
  };
}
