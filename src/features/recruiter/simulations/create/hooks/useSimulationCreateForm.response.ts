import {
  buildLoginUrl,
  buildNotAuthorizedUrl,
  buildReturnTo,
} from '@/lib/auth/routing';
import {
  mapSimulationValidationErrors,
  type FieldErrors,
} from '../utils/createFormConfig';

type CreateSimulationResult = {
  ok?: boolean;
  id?: string | null;
  status?: number | null;
  details?: unknown;
  message?: string | null;
};

type HandleFailureParams = {
  result: CreateSimulationResult;
  setErrors: (errors: FieldErrors) => void;
};

export function handleSimulationCreateFailure({
  result,
  setErrors,
}: HandleFailureParams): boolean {
  const status = result.status ?? null;
  const returnTo = buildReturnTo();

  if (status === 401) {
    window.location.assign(buildLoginUrl('recruiter', returnTo));
    return true;
  }
  if (status === 403) {
    window.location.assign(buildNotAuthorizedUrl('recruiter', returnTo));
    return true;
  }
  if (status === 422) {
    const validationErrors = mapSimulationValidationErrors(result.details);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return true;
    }
  }

  const fallback = result.message
    ? result.message
    : result.ok === false
      ? 'Unable to create simulation right now.'
      : 'Simulation created but no id was returned.';
  setErrors({ form: fallback });
  return true;
}
