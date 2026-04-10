import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { fetchTrialDetailQuery, TRIAL_DETAIL_STALE_TIME_MS } from '../queries';

export function useTrialPlanQuery(trialId: string) {
  return useQuery({
    queryKey: queryKeys.talentPartner.trialDetail(trialId),
    queryFn: ({ signal }) => fetchTrialDetailQuery(trialId, signal, false),
    enabled: Boolean(trialId),
    staleTime: TRIAL_DETAIL_STALE_TIME_MS,
  });
}
