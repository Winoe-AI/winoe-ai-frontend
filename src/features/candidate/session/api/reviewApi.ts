import { apiClient } from '@/platform/api-client/client';
import {
  HttpError,
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import { candidateClientOptions, mapCandidateApiError } from './baseApi';
import type { CandidateCompletedReviewResponse } from './typesApi';

export async function getCandidateCompletedReview(
  token: string,
  options?: { skipCache?: boolean; signal?: AbortSignal },
) {
  const path = `/candidate/session/${encodeURIComponent(token)}/review`;
  try {
    return await apiClient.get<CandidateCompletedReviewResponse>(
      path,
      {
        cache: 'no-store',
        signal: options?.signal,
        skipCache: options?.skipCache,
        cacheTtlMs: 10_000,
        dedupeKey: `candidate-session-review-${token}`,
      },
      candidateClientOptions,
    );
  } catch (err) {
    if (err && typeof err === 'object') {
      const status = (err as { status?: unknown }).status;
      const details = (err as { details?: unknown }).details;
      const backendMsg = extractBackendMessage(details, true) ?? '';

      if (status === 401) throw new HttpError(401, 'Please sign in again.');
      if (status === 403) {
        throw new HttpError(
          403,
          backendMsg.trim() ||
            'You do not have access to this completed review.',
        );
      }
      if (status === 409) {
        throw new HttpError(409, 'This simulation is not complete yet.');
      }

      throw new HttpError(
        fallbackStatus(err, 500),
        backendMsg.trim() || 'Unable to load your completed submission review.',
      );
    }
    mapCandidateApiError(
      err,
      'Unable to load your completed submission review.',
    );
  }
}
