import type { CandidateSessionBootstrapResponse } from '@/features/candidate/session/api/typesApi';
import type { ViewState } from '../CandidateSessionView';

export type InviteInitParams = {
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateSessionBootstrapResponse) => void;
  clearTaskError: () => void;
  setView: (v: ViewState) => void;
  setAuthMessage: (m: string | null) => void;
  setErrorMessage: (m: string | null) => void;
  setErrorStatus: (s: number | null) => void;
  redirectToLogin: () => void;
  fetchTask: (opts?: { sessionId?: number }) => Promise<void>;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};
