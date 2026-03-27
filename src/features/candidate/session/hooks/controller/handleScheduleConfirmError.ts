import { scheduleErrorCode } from './scheduleErrorCode';
import type {
  CandidateSessionScheduleParams,
  SetNullableString,
} from './candidateSessionSchedule.types';

type Params = Pick<
  CandidateSessionScheduleParams,
  | 'markEnd'
  | 'redirectToLogin'
  | 'setErrorStatus'
  | 'setErrorMessage'
  | 'setView'
  | 'runInit'
  | 'token'
> & {
  err: unknown;
  setScheduleSubmitError: SetNullableString;
  setScheduleTimezoneError: SetNullableString;
  setScheduleDateError: SetNullableString;
};

function errorStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' ? status : null;
}

export async function handleScheduleConfirmError({
  err,
  markEnd,
  redirectToLogin,
  setErrorStatus,
  setErrorMessage,
  setView,
  runInit,
  token,
  setScheduleSubmitError,
  setScheduleTimezoneError,
  setScheduleDateError,
}: Params) {
  const status = errorStatus(err);
  const message =
    err instanceof Error && err.message.trim()
      ? err.message
      : 'Unable to save your schedule right now.';
  const code = scheduleErrorCode(err);
  setErrorStatus(status);
  markEnd('candidate:schedule:submit', {
    status: 'error',
    httpStatus: status,
    errorCode: code,
  });

  if (status === 401) return redirectToLogin();
  if (status === 403) {
    setErrorMessage(message);
    setView('accessDenied');
    return;
  }
  if (status === 410) {
    setErrorMessage(message);
    setView('expired');
    return;
  }
  if (status === 409 && code === 'SCHEDULE_ALREADY_SET') {
    setScheduleSubmitError(null);
    await runInit(token, true);
    return;
  }
  if (status === 422 && code === 'SCHEDULE_INVALID_TIMEZONE') {
    setScheduleTimezoneError(message || 'Please enter a valid timezone.');
    setView('scheduling');
    return;
  }
  if (status === 422 && code === 'SCHEDULE_START_IN_PAST') {
    setScheduleDateError(message || 'Start date cannot be in the past.');
    setView('scheduling');
    return;
  }
  setScheduleSubmitError(message);
  setView('scheduleConfirm');
}
