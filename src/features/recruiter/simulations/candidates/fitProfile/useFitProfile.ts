import { useMemo } from 'react';
import { INITIAL_FIT_PROFILE_STATE, errorState } from './fitProfile.state';
import { stateFromLoadError, stateFromOutcome } from './fitProfile.stateResolve';
import { useFitProfileGenerate } from './useFitProfileGenerate';
import { useFitProfileQuery } from './useFitProfileQuery';
import { useFitProfileRefresh } from './useFitProfileRefresh';

export function useFitProfile(candidateSessionId: string) {
  const refreshStatusNow = useFitProfileRefresh(candidateSessionId);
  const fitProfileQuery = useFitProfileQuery(candidateSessionId);
  const { generatePending, stateOverride, generate, reload } =
    useFitProfileGenerate({ candidateSessionId, refreshStatusNow });

  const state = useMemo(() => {
    if (!candidateSessionId) {
      return errorState('Candidate session ID is missing.');
    }
    if (stateOverride) return stateOverride;
    if (fitProfileQuery.data) return stateFromOutcome(fitProfileQuery.data);
    if (fitProfileQuery.error) return stateFromLoadError(fitProfileQuery.error);
    return INITIAL_FIT_PROFILE_STATE;
  }, [
    candidateSessionId,
    fitProfileQuery.data,
    fitProfileQuery.error,
    stateOverride,
  ]);

  return {
    state,
    loading:
      !stateOverride &&
      (fitProfileQuery.isLoading ||
        (fitProfileQuery.isFetching && !fitProfileQuery.data)),
    generatePending,
    generate,
    reload,
  };
}
