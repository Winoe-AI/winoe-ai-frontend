import { requestWithMeta } from '@/platform/api-client/client/request';
import { HttpError } from '@/platform/api-client/errors/errors';
import { candidateClientOptions, mapCandidateApiError } from './baseApi';
import type { CandidateWorkspaceStatus } from './typesApi';
import { normalizeWorkspaceStatus } from './workspace.normalizeApi';

export async function requestWorkspaceStatus(params: {
  path: string;
  candidateSessionId: number;
  method?: 'POST';
  body?: Record<string, unknown>;
}): Promise<CandidateWorkspaceStatus> {
  const { path, candidateSessionId, method, body } = params;

  try {
    const { data } = await requestWithMeta<unknown>(
      path,
      {
        ...(method ? { method } : {}),
        ...(body ? { body } : {}),
        headers: { 'x-candidate-session-id': String(candidateSessionId) },
        cache: 'no-store',
      },
      candidateClientOptions,
    );
    return normalizeWorkspaceStatus(data);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new HttpError(
        0,
        'Network error. Please check your connection and try again.',
      );
    }
    mapCandidateApiError(err, 'Unable to load your workspace right now.');
  }
}
