import type { useCandidateSession } from '../../CandidateSessionProvider';
import type { ViewState } from '../../views/types';

export type SessionCtx = ReturnType<typeof useCandidateSession>;

export type CandidateSessionScheduleParams = {
  token: string;
  bootstrap: SessionCtx['state']['bootstrap'];
  view: ViewState;
  setView: (view: ViewState) => void;
  runInit: (token: string, force?: boolean) => Promise<unknown> | unknown;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
  redirectToLogin: () => void;
  setErrorStatus: (status: number | null) => void;
  setErrorMessage: (message: string | null) => void;
  detectedTimezone: string | null;
  session: SessionCtx;
};

export type SetNullableString = (value: string | null) => void;
