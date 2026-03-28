import { toMappedHttpError } from '@/platform/api-client/errors/errorMapping';
import { HttpError } from '@/platform/api-client/errors/errors';
import {
  deriveBackendMessage,
  normalizeStatus,
} from '@/features/candidate/session/api/taskErrorMessagesApi';
import { copyMappedAndThrow } from './handoffApi.errorThrow';
import {
  getHandoffErrorCode,
  getHandoffSourceDetails,
} from './handoffApi.errorExtract';
import {
  isEndpointUnavailableStatus,
  resolveHandoffErrorOverride,
  scopeFallback,
} from './handoffApi.errorResponses';
import type { RequestScope } from './handoffApi.types';

export { isEndpointUnavailableStatus };

export function mapHandoffApiError(err: unknown, scope: RequestScope): never {
  if (err instanceof TypeError) {
    throw new HttpError(
      0,
      'Network error. Please check your connection and try again.',
      (err as { headers?: Headers }).headers,
    );
  }

  const fallback = scopeFallback(scope);
  const backendMsg = deriveBackendMessage(err);
  const mapped = toMappedHttpError(err, fallback, 'candidate');
  const status = normalizeStatus(err, mapped.status);
  const sourceDetails = getHandoffSourceDetails(err);
  const errorCode = getHandoffErrorCode(err);
  const override = resolveHandoffErrorOverride({
    scope,
    status,
    errorCode,
    backendMsg,
  });

  if (override) {
    return copyMappedAndThrow(sourceDetails, mapped, override);
  }

  return copyMappedAndThrow(sourceDetails, mapped, {
    message: backendMsg ?? fallback,
  });
}
