import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import { type CandidateCompareRow } from '@/features/talent-partner/api';
import { toStatus, toUserMessage } from '@/platform/errors/errors';
import { queryKeys } from '@/shared/query';
import { generateCandidateWinoeReport } from '@/features/talent-partner/winoe-report/winoeReport.api';

type Params = {
  trialId: string;
  generatingIds: Record<string, boolean>;
  setGeneratingIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setLocalError: Dispatch<SetStateAction<string | null>>;
  queryClient: QueryClient;
  refetchCompare: () => Promise<unknown>;
};

export function useTrialCandidatesCompareGenerateAction({
  trialId,
  generatingIds,
  setGeneratingIds,
  setLocalError,
  queryClient,
  refetchCompare,
}: Params) {
  return useCallback(
    async (candidateSessionId: string) => {
      if (!candidateSessionId || generatingIds[candidateSessionId]) return;

      setLocalError(null);
      setGeneratingIds((prev) => ({ ...prev, [candidateSessionId]: true }));
      queryClient.setQueryData<CandidateCompareRow[]>(
        queryKeys.talentPartner.trialCompare(trialId),
        (prev) =>
          Array.isArray(prev)
            ? prev.map((row) =>
                row.candidateSessionId === candidateSessionId
                  ? { ...row, winoeReportStatus: 'generating' }
                  : row,
              )
            : prev,
      );

      try {
        await generateCandidateWinoeReport(candidateSessionId);
      } catch (caught: unknown) {
        const status = toStatus(caught);
        if (status === 403) {
          setLocalError(
            'You are not authorized to generate Winoe Reports for this candidate.',
          );
        } else if (status !== 409) {
          setLocalError(
            toUserMessage(
              caught,
              'Unable to generate Winoe Report right now.',
              {
                includeDetail: false,
              },
            ),
          );
        }
      } finally {
        setGeneratingIds((prev) => {
          const next = { ...prev };
          delete next[candidateSessionId];
          return next;
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.talentPartner.trialCompare(trialId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            queryKeys.talentPartner.winoeReportStatus(candidateSessionId),
        }),
      ]);
      await refetchCompare();
    },
    [
      generatingIds,
      queryClient,
      refetchCompare,
      setGeneratingIds,
      setLocalError,
      trialId,
    ],
  );
}
