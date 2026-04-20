import { useCallback } from 'react';
import type {
  CandidateSessionScheduleParams,
  SetNullableString,
} from './useCandidateSessionSchedule.types';
import { useScheduleConfirmAction } from './useScheduleConfirmAction';

type Params = Pick<
  CandidateSessionScheduleParams,
  | 'token'
  | 'bootstrap'
  | 'setView'
  | 'runInit'
  | 'markStart'
  | 'markEnd'
  | 'redirectToLogin'
  | 'setErrorStatus'
  | 'setErrorMessage'
  | 'session'
> & {
  scheduleDateValue: string;
  scheduleTimezoneValue: string;
  scheduleGithubUsernameValue: string;
  validateForm: () => boolean;
  clearScheduleErrors: () => void;
  setScheduleSubmitError: SetNullableString;
  setScheduleTimezoneError: SetNullableString;
  setScheduleDateError: SetNullableString;
};

export function useCandidateSessionScheduleSubmit({
  token,
  bootstrap,
  setView,
  runInit,
  markStart,
  markEnd,
  redirectToLogin,
  setErrorStatus,
  setErrorMessage,
  session,
  scheduleDateValue,
  scheduleTimezoneValue,
  scheduleGithubUsernameValue,
  validateForm,
  clearScheduleErrors,
  setScheduleSubmitError,
  setScheduleTimezoneError,
  setScheduleDateError,
}: Params) {
  const onScheduleContinue = useCallback(() => {
    if (!validateForm()) return;
    setView('scheduleConfirm');
  }, [setView, validateForm]);

  const onScheduleBack = useCallback(() => {
    clearScheduleErrors();
    setView('scheduling');
  }, [clearScheduleErrors, setView]);

  const onScheduleConfirm = useScheduleConfirmAction({
    token,
    bootstrap,
    setView,
    runInit,
    markStart,
    markEnd,
    redirectToLogin,
    setErrorStatus,
    setErrorMessage,
    session,
    scheduleDateValue,
    scheduleTimezoneValue,
    scheduleGithubUsernameValue,
    validateForm,
    clearScheduleErrors,
    setScheduleSubmitError,
    setScheduleTimezoneError,
    setScheduleDateError,
  });

  const onScheduleRetry = useCallback(() => {
    setScheduleSubmitError(null);
    void runInit(token, true);
  }, [runInit, setScheduleSubmitError, token]);

  return {
    onScheduleContinue,
    onScheduleBack,
    onScheduleConfirm,
    onScheduleRetry,
    onRefreshScheduleLock: onScheduleRetry,
  };
}
