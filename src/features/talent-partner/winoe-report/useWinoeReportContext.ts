import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import {
  fetchTrialCandidatesQuery,
  fetchTrialDetailQuery,
} from '../trial-management/detail/queries';

type UseWinoeReportContextArgs = {
  trialId: string;
  candidateSessionId: string;
};

export function useWinoeReportContext({
  trialId,
  candidateSessionId,
}: UseWinoeReportContextArgs) {
  const trialQuery = useQuery({
    queryKey: queryKeys.talentPartner.trialDetail(trialId),
    queryFn: ({ signal }) => fetchTrialDetailQuery(trialId, signal, true),
    enabled: Boolean(trialId),
    staleTime: 5 * 60 * 1000,
  });

  const candidatesQuery = useQuery({
    queryKey: queryKeys.talentPartner.trialCandidates(trialId),
    queryFn: ({ signal }) => fetchTrialCandidatesQuery(trialId, signal, true),
    enabled: Boolean(trialId),
    staleTime: 60_000,
  });

  const metadata = useMemo(() => {
    const trialTitle =
      trialQuery.data?.plan?.title?.trim() ||
      trialQuery.data?.plan?.scenario?.trim() ||
      `Trial ${trialId}`;
    const trialStatus = trialQuery.data?.status ?? null;
    const candidate = candidatesQuery.data?.find(
      (item) => String(item.candidateSessionId) === candidateSessionId,
    );
    return {
      trialTitle,
      trialStatus,
      candidateName: candidate?.candidateName?.trim() || null,
      candidateStatus: candidate?.status ?? null,
    };
  }, [candidateSessionId, candidatesQuery.data, trialId, trialQuery.data]);

  return {
    ...metadata,
    loading:
      trialQuery.isLoading ||
      trialQuery.isFetching ||
      candidatesQuery.isLoading ||
      candidatesQuery.isFetching,
  };
}
