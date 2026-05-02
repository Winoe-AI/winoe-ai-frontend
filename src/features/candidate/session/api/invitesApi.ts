import {
  INVITE_ALREADY_CLAIMED_MESSAGE,
  INVITE_EXPIRED_MESSAGE,
  INVITE_INVALID_MESSAGE,
  INVITE_TERMINATED_MESSAGE,
} from '@/platform/copy/invite';
import { apiClient } from '@/platform/api-client/client';
import {
  HttpError,
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import { candidateClientOptions, mapCandidateApiError } from './baseApi';
import { normalizeCandidateInvite } from './inviteNormalizeApi';
import {
  classifyInviteErrorState,
  extractInviteErrorContact,
  inviteErrorHttpError,
} from './inviteErrorsApi';
import type {
  CandidateInvite,
  CandidateSessionBootstrapResponse,
} from './typesApi';

const CANDIDATE_INVITES_PATH = '/candidate/invites?includeTerminated=true';

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

function inviteErrorMessageForState(inviteState: string | null) {
  switch (inviteState) {
    case 'terminated':
      return INVITE_TERMINATED_MESSAGE;
    case 'expired':
      return INVITE_EXPIRED_MESSAGE;
    case 'already_claimed':
      return INVITE_ALREADY_CLAIMED_MESSAGE;
    case 'invalid':
      return INVITE_INVALID_MESSAGE;
    default:
      return 'Please sign in again.';
  }
}

export async function listCandidateInvites(options?: {
  signal?: AbortSignal;
  skipCache?: boolean;
}): Promise<CandidateInvite[]> {
  try {
    const data = await apiClient.get<unknown[]>(
      CANDIDATE_INVITES_PATH,
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
      const details =
        (err as { details?: unknown; detail?: unknown }).details ??
        (err as { details?: unknown; detail?: unknown }).detail;
      const backendMsg = extractBackendMessage(details, true) ?? '';
      const lowerMsg = backendMsg.toLowerCase();
      const inviteState = classifyInviteErrorState(err);
      const inviteContact = extractInviteErrorContact(err);

      if (status === 409) {
        const recovered = recoverInviteBootstrap(details);
        if (recovered) return recovered;
      }
      if (inviteState === 'terminated' || inviteState === 'expired') {
        throw inviteErrorHttpError(
          typeof status === 'number'
            ? status
            : inviteState === 'terminated'
              ? 410
              : 410,
          inviteState === 'terminated'
            ? INVITE_TERMINATED_MESSAGE
            : INVITE_EXPIRED_MESSAGE,
          details,
          inviteState,
        );
      }
      if (inviteState === 'invalid')
        throw inviteErrorHttpError(
          typeof status === 'number' ? status : 400,
          INVITE_INVALID_MESSAGE,
          details,
          inviteState,
        );
      if (inviteState === 'already_claimed')
        throw inviteErrorHttpError(
          typeof status === 'number' ? status : 409,
          INVITE_ALREADY_CLAIMED_MESSAGE,
          details,
          inviteState,
        );
      if (status === 401) {
        if (inviteState !== 'unavailable') {
          throw inviteErrorHttpError(
            401,
            inviteErrorMessageForState(inviteState),
            details,
            inviteState,
          );
        }
        throw new HttpError(401, 'Please sign in again.');
      }
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
        throw inviteErrorHttpError(
          410,
          INVITE_EXPIRED_MESSAGE,
          details,
          'expired',
        );

      const fallbackMsg =
        extractBackendMessage(details, false) ?? backendMsg ?? '';
      const safeStatus =
        typeof status === 'number' ? status : fallbackStatus(err, 500);
      const error = new HttpError(
        safeStatus,
        fallbackMsg.trim() || 'Something went wrong loading your trial.',
      ) as HttpError & {
        inviteErrorState?: string;
        inviteContactName?: string | null;
        inviteContactEmail?: string | null;
      };
      error.inviteErrorState = inviteState;
      error.inviteContactEmail = inviteContact.email;
      error.inviteContactName = inviteContact.name;
      throw error;
    }
    mapCandidateApiError(err, 'Something went wrong loading your trial.');
  }
}
