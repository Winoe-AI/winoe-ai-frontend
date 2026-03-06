import { INVITE_EXPIRED_MESSAGE } from '@/lib/copy/invite';
import { apiClient } from '@/lib/api/client';
import {
  HttpError,
  extractBackendMessage,
  fallbackStatus,
} from '@/lib/api/errors/errors';
import { candidateClientOptions, mapCandidateApiError } from './base';
import type { CandidateScheduleResponse } from './types';

type SchedulePayload = {
  scheduledStartAt: string;
  candidateTimezone: string;
};

function scheduleErrorCode(details: unknown): string | null {
  if (!details || typeof details !== 'object') return null;
  const rec = details as Record<string, unknown>;
  if (typeof rec.errorCode === 'string' && rec.errorCode.trim())
    return rec.errorCode.trim();
  if (typeof rec.code === 'string' && rec.code.trim()) return rec.code.trim();
  return null;
}

function throwScheduleError(
  status: number,
  message: string,
  details: unknown,
): never {
  const err = new HttpError(status, message);
  (err as { details?: unknown }).details = details;
  throw err;
}

export async function scheduleCandidateSession(
  token: string,
  payload: SchedulePayload,
): Promise<CandidateScheduleResponse> {
  const path = `/candidate/session/${encodeURIComponent(token)}/schedule`;
  try {
    return await apiClient.post<CandidateScheduleResponse>(
      path,
      payload,
      { cache: 'no-store' },
      candidateClientOptions,
    );
  } catch (err) {
    if (err && typeof err === 'object') {
      const status = (err as { status?: unknown }).status;
      const details = (err as { details?: unknown }).details;
      const backendMsg = extractBackendMessage(details, true) ?? '';
      const code = scheduleErrorCode(details);
      if (status === 401)
        throwScheduleError(401, 'Please sign in again.', details);
      if (status === 403)
        throwScheduleError(
          403,
          'You do not have access to this invite.',
          details,
        );
      if (status === 410)
        throwScheduleError(410, INVITE_EXPIRED_MESSAGE, details);
      if (status === 422) {
        if (code === 'SCHEDULE_INVALID_TIMEZONE')
          throwScheduleError(
            422,
            backendMsg || 'Please enter a valid timezone.',
            details,
          );
        if (code === 'SCHEDULE_START_IN_PAST')
          throwScheduleError(
            422,
            backendMsg || 'Start date must be in the future.',
            details,
          );
        throwScheduleError(
          422,
          backendMsg ||
            'Unable to schedule with the selected date and timezone.',
          details,
        );
      }
      if (status === 409) {
        throwScheduleError(
          409,
          backendMsg || 'Schedule is already set for this invite.',
          details,
        );
      }
      const fallbackMsg =
        extractBackendMessage(details, false) ?? backendMsg ?? '';
      const safeStatus =
        typeof status === 'number' ? status : fallbackStatus(err, 500);
      throwScheduleError(
        safeStatus,
        fallbackMsg.trim() || 'Unable to save your schedule right now.',
        details,
      );
    }
    mapCandidateApiError(err, 'Unable to save your schedule right now.');
  }
}
