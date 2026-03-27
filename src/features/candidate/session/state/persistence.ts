import { useEffect } from 'react';
import type { CandidateSessionState, ReducerPair } from './types';
import { loadPersistedState } from './persistence.load';
import { persistCandidateSessionState } from './persistence.save';

export function usePersistedState(
  state: CandidateSessionState,
  dispatch: ReducerPair['dispatch'],
) {
  useEffect(() => {
    loadPersistedState(dispatch);
  }, [dispatch]);

  useEffect(() => {
    persistCandidateSessionState(state);
  }, [state]);
}
