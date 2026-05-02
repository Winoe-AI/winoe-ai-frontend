import type { CandidateSessionBootstrapResponse } from '@/features/candidate/session/api/typesApi';
import type { InviteErrorState } from '@/features/candidate/session/api/inviteErrorsApi';
import type { ViewState } from '../CandidateSessionView';
import type { CandidateSessionViewProps } from '../views/types';

export type InviteInitParams = {
  authStatus: CandidateSessionViewProps['authStatus'];
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateSessionBootstrapResponse) => void;
  clearTaskError: () => void;
  setView: (v: ViewState) => void;
  setAuthMessage: (m: string | null) => void;
  setErrorMessage: (m: string | null) => void;
  setErrorStatus: (s: number | null) => void;
  setInviteErrorState: (state: InviteErrorState | null) => void;
  setInviteContactName: (name: string | null) => void;
  setInviteContactEmail: (email: string | null) => void;
  redirectToLogin: () => void;
  fetchTask: (opts?: { sessionId?: number }) => Promise<void>;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};
