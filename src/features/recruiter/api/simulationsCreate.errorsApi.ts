import { throwMappedApiError } from '@/platform/api-client/errors/errorMapping';
import {
  extractBackendMessage,
  fallbackStatus,
} from '@/platform/api-client/errors/errors';
import type { CreateSimulationResponse } from './typesApi';

export function mapCreateSimulationError(
  caught: unknown,
): CreateSimulationResponse {
  if (!(caught instanceof TypeError) && caught) {
    try {
      throwMappedApiError(
        caught,
        'Unable to create simulation right now.',
        'recruiter',
      );
    } catch (mapped) {
      const status = (mapped as { status?: number }).status ?? 0;
      const message =
        (mapped as { message?: string }).message ??
        'Unable to create simulation right now.';
      const details = (mapped as { details?: unknown }).details;
      return { ok: false, status, id: '', message, details };
    }
  }

  const status = fallbackStatus(caught, 0);
  const details = (caught as { details?: unknown })?.details;
  const message =
    extractBackendMessage(details ?? caught, true) ??
    (caught instanceof Error ? caught.message : null) ??
    'Unable to create simulation right now.';
  return { ok: false, status, id: '', message, details };
}
