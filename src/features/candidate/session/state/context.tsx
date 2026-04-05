'use client';
import { createContext, useContext } from 'react';
import type { Ctx } from './types';

export const CandidateSessionContext = createContext<Ctx | null>(null);

export function useOptionalCandidateSession() {
  return useContext(CandidateSessionContext);
}

export function useCandidateSession() {
  const ctx = useOptionalCandidateSession();
  if (!ctx)
    throw new Error(
      'useCandidateSession must be used within CandidateSessionProvider',
    );
  return ctx;
}
