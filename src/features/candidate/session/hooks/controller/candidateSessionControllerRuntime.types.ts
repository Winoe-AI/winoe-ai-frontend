import type { ViewState } from '../../views/types';
import type { usePerfMarks } from '../usePerfMarks';
import type { useCandidateSessionControllerLocalState } from './useCandidateSessionControllerLocalState';
import type { SessionCtx } from './candidateSessionSchedule.types';

type LocalState = ReturnType<typeof useCandidateSessionControllerLocalState>;
type PerfMarks = ReturnType<typeof usePerfMarks>;

export type UseCandidateSessionControllerRuntimeArgs = {
  token: string;
  session: SessionCtx;
  sessionForActions: SessionCtx;
  currentTask: SessionCtx['state']['taskState']['currentTask'];
  currentTaskId: number | null;
  candidateSessionId: number | null;
  bootstrap: SessionCtx['state']['bootstrap'];
  redirectToLogin: () => void;
  detectedTimezone: string | null;
  view: ViewState;
  setView: LocalState['setView'];
  setErrorMessage: LocalState['setErrorMessage'];
  setErrorStatus: LocalState['setErrorStatus'];
  setAuthMessage: LocalState['setAuthMessage'];
  handleTaskWindowClosed: LocalState['handleTaskWindowClosed'];
  resetLocalState: LocalState['resetLocalState'];
  markStart: PerfMarks['markStart'];
  markEnd: PerfMarks['markEnd'];
};
