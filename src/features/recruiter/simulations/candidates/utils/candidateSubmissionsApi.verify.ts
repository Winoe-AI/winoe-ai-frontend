import { listSimulationCandidates } from '@/features/recruiter/api';
import { normalizeCandidateSession } from '@/features/recruiter/api/candidatesNormalize';
import { recruiterBffClient } from '@/lib/api/client';
import { isAbortError } from './candidateSubmissionsApi.primitives';

export async function verifyCandidate(
  simulationId: string,
  candidateSessionId: string,
  signal?: AbortSignal,
  skipCache?: boolean,
) {
  try {
    const list = await listSimulationCandidates(simulationId, {
      cache: 'no-store',
      signal,
      skipCache,
      cacheTtlMs: 9000,
      dedupeKey: `simulation-candidates-${simulationId}`,
    });
    const candidates = Array.isArray(list)
      ? list
      : await recruiterBffClient
          .get<unknown>(`/simulations/${encodeURIComponent(simulationId)}/candidates`, {
            cache: 'no-store',
            signal,
            skipCache,
            cacheTtlMs: 9000,
            dedupeKey: `simulation-candidates-${simulationId}`,
          })
          .then((payload) =>
            Array.isArray(payload)
              ? payload.map((entry) => normalizeCandidateSession(entry))
              : [],
          );
    const found = candidates.find((c) => String(c.candidateSessionId) === candidateSessionId) ?? null;
    if (!found) throw new Error('Candidate not found for this simulation.');
    return found;
  } catch (e) {
    if ((signal && signal.aborted) || isAbortError(e)) throw e;
    if (typeof e === 'string') throw e;
    const message = e instanceof Error && e.message ? e.message : 'Unable to verify candidate access.';
    throw new Error(message);
  }
}
