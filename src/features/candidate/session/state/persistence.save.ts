import { STORAGE_KEY } from './state';
import type { CandidateSessionState, PersistedState } from './types';

export function persistCandidateSessionState(state: CandidateSessionState) {
  try {
    const toPersist: PersistedState = {
      inviteToken: state.inviteToken,
      candidateSessionId: state.candidateSessionId,
      bootstrap: state.bootstrap,
      started: state.started,
      taskState: {
        isComplete: state.taskState.isComplete,
        completedAt: state.taskState.completedAt,
        completedTaskIds: state.taskState.completedTaskIds,
        currentTask: state.taskState.currentTask,
      },
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {}
}
