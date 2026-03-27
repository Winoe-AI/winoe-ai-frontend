import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { type QueryClient } from '@tanstack/react-query';
import { type CandidateCompareRow } from '@/features/recruiter/api';
import { toStatus, toUserMessage } from '@/lib/errors/errors';
import { queryKeys } from '@/shared/query';
import { generateCandidateFitProfile } from '@/features/recruiter/simulations/candidates/fitProfile/fitProfile.api';

type Params = {
  simulationId: string;
  generatingIds: Record<string, boolean>;
  setGeneratingIds: Dispatch<SetStateAction<Record<string, boolean>>>;
  setLocalError: Dispatch<SetStateAction<string | null>>;
  queryClient: QueryClient;
  refetchCompare: () => Promise<unknown>;
};

export function useSimulationCandidatesCompareGenerateAction({
  simulationId,
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
        queryKeys.recruiter.simulationCompare(simulationId),
        (prev) =>
          Array.isArray(prev)
            ? prev.map((row) =>
                row.candidateSessionId === candidateSessionId
                  ? { ...row, fitProfileStatus: 'generating' }
                  : row,
              )
            : prev,
      );

      try {
        await generateCandidateFitProfile(candidateSessionId);
      } catch (caught: unknown) {
        const status = toStatus(caught);
        if (status === 403) {
          setLocalError(
            'You are not authorized to generate Fit Profiles for this candidate.',
          );
        } else if (status !== 409) {
          setLocalError(
            toUserMessage(caught, 'Unable to generate Fit Profile right now.', {
              includeDetail: false,
            }),
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
          queryKey: queryKeys.recruiter.simulationCompare(simulationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.recruiter.fitProfileStatus(candidateSessionId),
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
      simulationId,
    ],
  );
}
