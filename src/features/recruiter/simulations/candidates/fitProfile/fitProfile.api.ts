import { recruiterBffClient } from '@/lib/api/client';
import type { FitProfileFetchOutcome } from './fitProfile.types';
import { normalizeFitProfilePayload } from './fitProfile.normalizePayload';

export { normalizeFitProfilePayload };

export async function fetchCandidateFitProfile(
  candidateSessionId: string,
  signal?: AbortSignal,
  options?: { skipCache?: boolean },
): Promise<FitProfileFetchOutcome> {
  const encodedId = encodeURIComponent(candidateSessionId);
  const payload = await recruiterBffClient.get<unknown>(
    `/candidate_sessions/${encodedId}/fit_profile`,
    {
      cache: 'no-store',
      signal,
      skipCache: options?.skipCache,
      cacheTtlMs: 10_000,
      dedupeKey: `fit-profile-status-${candidateSessionId}`,
    },
  );
  return normalizeFitProfilePayload(payload);
}

export async function generateCandidateFitProfile(
  candidateSessionId: string,
): Promise<void> {
  const encodedId = encodeURIComponent(candidateSessionId);
  await recruiterBffClient.post<unknown>(
    `/candidate_sessions/${encodedId}/fit_profile/generate`,
    {},
    {
      cache: 'no-store',
      skipCache: true,
      disableDedupe: true,
      cacheTtlMs: 0,
    },
  );
}
