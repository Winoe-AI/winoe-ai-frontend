import { recruiterBffClient } from '@/lib/api/client';
import type { SubmissionArtifact, SubmissionListResponse } from '../types';
import { normalizeArtifact, normalizeListResponse } from './candidateSubmissionsApi.normalizers';

export async function fetchCandidateSubmissions(
  candidateSessionId: string,
  signal?: AbortSignal,
  skipCache?: boolean,
  simulationId?: string,
): Promise<SubmissionListResponse> {
  const encoded = encodeURIComponent(candidateSessionId);
  const parts = [`candidateSessionId=${encoded}`, `candidate_session_id=${encoded}`];
  if (simulationId) {
    const encodedSim = encodeURIComponent(simulationId);
    parts.push(`simulationId=${encodedSim}`, `simulation_id=${encodedSim}`);
  }
  const data = await recruiterBffClient.get<SubmissionListResponse>(
    `/submissions?${parts.join('&')}`,
    {
      cache: 'no-store',
      signal,
      skipCache,
      cacheTtlMs: 9000,
      dedupeKey: `candidate-submissions-${simulationId ?? 'unknown'}-${candidateSessionId}`,
    },
  );
  return normalizeListResponse(data);
}

export async function fetchArtifactsWithLimit(
  ids: number[],
  options: { signal?: AbortSignal; skipCache?: boolean; cacheTtlMs?: number; concurrency?: number },
) {
  if (!ids.length) return { results: {}, hadError: false };
  const results: Record<number, SubmissionArtifact> = {};
  const limit = Math.max(1, Math.min(options.concurrency ?? 4, 12));
  let index = 0;
  let hadError = false;

  const worker = async () => {
    while (index < ids.length) {
      const current = ids[index];
      index += 1;
      try {
        const artifact = await recruiterBffClient.get<SubmissionArtifact>(`/submissions/${current}`, {
          cache: 'no-store',
          signal: options.signal,
          skipCache: options.skipCache,
          cacheTtlMs: options.cacheTtlMs ?? 10000,
          dedupeKey: `submission-${current}`,
        });
        results[current] = normalizeArtifact(artifact);
      } catch {
        hadError = true;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, ids.length) }).map(() => worker()));
  return { results, hadError };
}
