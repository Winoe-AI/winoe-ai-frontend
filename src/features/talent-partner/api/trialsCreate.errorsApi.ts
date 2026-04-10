import { throwMappedApiError } from '@/platform/api-client/errors/errorMapping';
import {
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import type { CreateTrialResponse } from './typesApi';

export function mapCreateTrialError(caught: unknown): CreateTrialResponse {
  if (!(caught instanceof TypeError) && caught) {
    try {
      throwMappedApiError(
        caught,
        'Unable to create trial right now.',
        'talent_partner',
      );
    } catch (mapped) {
      const status = (mapped as { status?: number }).status ?? 0;
      const message =
        (mapped as { message?: string }).message ??
        'Unable to create trial right now.';
      const details = (mapped as { details?: unknown }).details;
      return { ok: false, status, id: '', message, details };
    }
  }

  const status = fallbackStatus(caught, 0);
  const details = (caught as { details?: unknown })?.details;
  const message =
    extractBackendMessage(details ?? caught, true) ??
    (caught instanceof Error ? caught.message : null) ??
    'Unable to create trial right now.';
  return { ok: false, status, id: '', message, details };
}
