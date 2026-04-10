import { useCallback, useState } from 'react';
import { toStatus } from '@/platform/errors/errors';
import { generateCandidateWinoeReport } from './winoeReport.api';
import { generatingState } from './winoeReport.state';
import { stateFromGenerateError } from './winoeReport.stateResolve';
import type { WinoeReportState } from './winoeReport.types';

type UseWinoeReportGenerateArgs = {
  candidateSessionId: string;
  refreshStatusNow: () => Promise<void>;
};

export function useWinoeReportGenerate({
  candidateSessionId,
  refreshStatusNow,
}: UseWinoeReportGenerateArgs) {
  const [generatePending, setGeneratePending] = useState(false);
  const [stateOverride, setStateOverride] = useState<WinoeReportState | null>(
    null,
  );

  const generate = useCallback(async () => {
    if (!candidateSessionId || generatePending) return;
    setGeneratePending(true);
    setStateOverride(generatingState());
    try {
      await generateCandidateWinoeReport(candidateSessionId);
      await refreshStatusNow();
      setStateOverride(null);
    } catch (error) {
      setStateOverride(stateFromGenerateError(error));
      if (toStatus(error) === 409) {
        await refreshStatusNow();
        setStateOverride(null);
      }
    } finally {
      setGeneratePending(false);
    }
  }, [candidateSessionId, generatePending, refreshStatusNow]);

  const reload = useCallback(async () => {
    setStateOverride(null);
    await refreshStatusNow();
  }, [refreshStatusNow]);

  return { generatePending, stateOverride, generate, reload };
}
