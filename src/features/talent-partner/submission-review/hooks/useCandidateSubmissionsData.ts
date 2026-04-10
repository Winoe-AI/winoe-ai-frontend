import { useCandidateSubmissionsLoader } from './useCandidateSubmissionsLoader';
import { useCandidateSubmissionsState } from './useCandidateSubmissionsState';

export function useCandidateSubmissionsData(
  trialId: string,
  candidateSessionId: string,
  pageSize: number,
) {
  const { state, setters } = useCandidateSubmissionsState();
  const loader = useCandidateSubmissionsLoader({
    trialId,
    candidateSessionId,
    pageSize,
    showAll: state.showAll,
    setters,
  });

  return {
    state,
    actions: {
      reload: () => loader.reload({ skipCache: true }),
      toggleShowAll: loader.toggleShowAll,
      setArtifacts: setters.setArtifacts,
      setArtifactWarning: setters.setArtifactWarning,
    },
    setShowAll: setters.setShowAll,
  };
}
