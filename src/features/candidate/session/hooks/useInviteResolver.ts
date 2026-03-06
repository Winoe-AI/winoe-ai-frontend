import { useEffect } from 'react';
import { buildLoginHref } from '@/features/auth/authPaths';
import type React from 'react';
import { useInviteInit } from './useInviteInit';
import type { CandidateSessionBootstrapResponse } from '@/features/candidate/api';
import type { ViewState } from '../views/types';

type Params = {
  token: string;
  setCandidateSessionId: (id: number | null) => void;
  setBootstrap: (b: CandidateSessionBootstrapResponse) => void;
  clearTaskError: () => void;
  redirectToLogin: () => void;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  setAuthMessage: (m: string | null) => void;
  setErrorMessage: (m: string | null) => void;
  setErrorStatus: (s: number | null) => void;
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
