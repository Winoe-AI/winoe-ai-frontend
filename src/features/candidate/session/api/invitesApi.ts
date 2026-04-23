import {
  INVITE_ALREADY_CLAIMED_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
} from '@/platform/copy/invite';
import { apiClient } from '@/platform/api-client/client';
import {
  HttpError,
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import { candidateClientOptions, mapCandidateApiError } from './baseApi';
import { normalizeCandidateInvite } from './inviteNormalizeApi';
import type {
  CandidateInvite,
  CandidateSessionBootstrapResponse,
} from './typesApi';

function isBootstrapLike(
  value: unknown,
): value is CandidateSessionBootstrapResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    'candidateSessionId' in value &&
    'trial' in value
  );
}

function recoverInviteBootstrap(
  details: unknown,
): CandidateSessionBootstrapResponse | null {
  if (isBootstrapLike(details)) return details;
  if (!details || typeof details !== 'object') return null;

  const record = details as Record<string, unknown>;
  const candidates = [record.bootstrap, record.session, record.recovery];
  for (const candidate of candidates) {
    if (isBootstrapLike(candidate)) return candidate;
  }

  return null;
}

function inviteHttpError(
  status: number,
  message: string,
  details?: unknown,
): HttpError {
  const error = new HttpError(status, message);
  if (typeof details !== 'undefined') {
    (error as HttpError & { details?: unknown }).details = details;
  }
  return error;
}

export async function listCandidateInvites(options?: {
  signal?: AbortSignal;
  skipCache?: boolean;
}): Promise<CandidateInvite[]> {
  try {
    const data = await apiClient.get<unknown[]>(
      '/candidate/invites',
      {
        cache: 'no-store',
        signal: options?.signal,
        skipCache: options?.skipCache,
        cacheTtlMs: 60_000,
        dedupeKey: 'candidate-invites',
      },
      candidateClientOptions,
    );
    return Array.isArray(data) ? data.map(normalizeCandidateInvite) : [];
  } catch (err) {
    mapCandidateApiError(err, 'Unable to load your invites right now.');
  }
}

export async function resolveCandidateInviteToken(
  token: string,
  options?: { skipCache?: boolean; signal?: AbortSignal },
) {
  const path = `/candidate/session/${encodeURIComponent(token)}`;
  try {
    return await apiClient.get<CandidateSessionBootstrapResponse>(
      path,
      {
        cache: 'no-store',
        signal: options?.signal,
        skipCache: options?.skipCache,
        cacheTtlMs: 10_000,
        dedupeKey: `candidate-session-bootstrap-${token}`,
      },
      candidateClientOptions,
    );
  } catch (err) {
    if (err && typeof err === 'object') {
      const status = (err as { status?: unknown }).status;
      const details = (err as { details?: unknown }).details;
      const backendMsg = extractBackendMessage(details, true) ?? '';
      const lowerMsg = backendMsg.toLowerCase();

      if (status === 409) {
        const recovered = recoverInviteBootstrap(details);
        if (recovered) return recovered;
      }
      if (status === 400 || status === 404)
        throw inviteHttpError(status, INVITE_INVALID_MESSAGE, details);
      if (status === 409)
        throw inviteHttpError(409, INVITE_ALREADY_CLAIMED_MESSAGE, details);
      if (status === 401) throw new HttpError(401, 'Please sign in again.');
      if (status === 403) {
        if (lowerMsg.includes('email claim') || lowerMsg.includes('email')) {
          throw new HttpError(
            403,
            'We could not confirm your sign-in. Please sign in again.',
          );
        }
        throw new HttpError(403, 'You do not have access to this invite.');
      }
      if (status === 410)
        throw inviteHttpError(410, INVITE_EXPIRED_MESSAGE, details);

      const fallbackMsg =
        extractBackendMessage(details, false) ?? backendMsg ?? '';
      const safeStatus =
        typeof status === 'number' ? status : fallbackStatus(err, 500);
      throw new HttpError(
        safeStatus,
        fallbackMsg.trim() || 'Something went wrong loading your trial.',
      );
    }
    mapCandidateApiError(err, 'Something went wrong loading your trial.');
  }
}
