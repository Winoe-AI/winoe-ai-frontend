import { useEffect } from 'react';
import { buildLoginHref } from '@/features/auth/authPaths';
import type React from 'react';
import type { InviteErrorState } from '@/features/candidate/session/api/inviteErrorsApi';
import { useInviteInit } from './useInviteInit';
import type { CandidateSessionBootstrapResponse } from '@/features/candidate/session/api';
import type { ViewState } from '../views/types';
import type { CandidateSessionViewProps } from '../views/types';

type Params = {
  token: string;
  authStatus: CandidateSessionViewProps['authStatus'];
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateSessionBootstrapResponse) => void;
  clearTaskError: () => void;
  redirectToLogin: () => void;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  setAuthMessage: (m: string | null) => void;
  setErrorMessage: (m: string | null) => void;
  setErrorStatus: (s: number | null) => void;
  setInviteErrorState: (state: InviteErrorState | null) => void;
  setInviteContactName: (name: string | null) => void;
  setInviteContactEmail: (email: string | null) => void;
  fetchTask: (opts?: { sessionId?: number }) => Promise<void>;
  markStart: (label: string) => void;
  markEnd: (label: string, extra?: Record<string, unknown>) => void;
};

export function useInviteResolver(params: Params) {
  const { runInit, inviteErrorCopy } = useInviteInit(params);

  useEffect(() => {
    void runInit(params.token);
  }, [params.token, runInit]);

  const loginHref = buildLoginHref(
    `/candidate/session/${encodeURIComponent(params.token)}`,
    'candidate',
  );

  return { runInit, loginHref, inviteErrorCopy };
}
