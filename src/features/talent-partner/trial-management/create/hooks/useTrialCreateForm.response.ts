import {
  buildLoginUrl,
  buildNotAuthorizedUrl,
  buildReturnTo,
} from '@/platform/auth/routing';
import {
  mapTrialValidationErrors,
  type FieldErrors,
} from '../utils/createFormConfigUtils';

type CreateTrialResult = {
  ok?: boolean;
  id?: string | null;
  status?: number | null;
  details?: unknown;
  message?: string | null;
};

type HandleFailureParams = {
  result: CreateTrialResult;
  setErrors: (errors: FieldErrors) => void;
};

export function handleTrialCreateFailure({
  result,
  setErrors,
}: HandleFailureParams): boolean {
  const status = result.status ?? null;
  const returnTo = buildReturnTo();

  if (status === 401) {
    window.location.assign(buildLoginUrl('talent_partner', returnTo));
    return true;
  }
  if (status === 403) {
    window.location.assign(buildNotAuthorizedUrl('talent_partner', returnTo));
    return true;
  }
  if (status === 422) {
    const validationErrors = mapTrialValidationErrors(result.details);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return true;
    }
  }

  const fallback = result.message
    ? result.message
    : result.ok === false
      ? 'Unable to create trial right now.'
      : 'Trial created but no id was returned.';
  setErrors({ form: fallback });
  return true;
}
