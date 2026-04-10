import { listTrialCandidates } from '@/features/talent-partner/api';
import { normalizeCandidateSession } from '@/features/talent-partner/api/candidatesNormalizeApi';
import { talentPartnerBffClient } from '@/platform/api-client/client';
import { isAbortError } from './candidateSubmissionsApi.primitivesUtils';

export async function verifyCandidate(
  trialId: string,
  candidateSessionId: string,
  signal?: AbortSignal,
  skipCache?: boolean,
) {
  try {
    const list = await listTrialCandidates(trialId, {
      cache: 'no-store',
      signal,
      skipCache,
      cacheTtlMs: 9000,
      dedupeKey: `trial-candidates-${trialId}`,
    });
    const candidates = Array.isArray(list)
      ? list
      : await talentPartnerBffClient
          .get<unknown>(`/trials/${encodeURIComponent(trialId)}/candidates`, {
            cache: 'no-store',
            signal,
            skipCache,
            cacheTtlMs: 9000,
            dedupeKey: `trial-candidates-${trialId}`,
          })
          .then((payload) =>
            Array.isArray(payload)
              ? payload.map((entry) => normalizeCandidateSession(entry))
              : [],
          );
    const found =
      candidates.find(
        (c) => String(c.candidateSessionId) === candidateSessionId,
      ) ?? null;
    if (!found) throw new Error('Candidate not found for this trial.');
    return found;
  } catch (e) {
    if ((signal && signal.aborted) || isAbortError(e)) throw e;
    if (typeof e === 'string') throw e;
    const message =
      e instanceof Error && e.message
        ? e.message
        : 'Unable to verify candidate access.';
    throw new Error(message);
  }
}
