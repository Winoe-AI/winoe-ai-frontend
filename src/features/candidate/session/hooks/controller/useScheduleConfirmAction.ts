import { useCallback } from 'react';
import {
  isScheduleLocked,
  localDateAtHourToUtcIso,
} from '../../utils/scheduleUtils';
import type {
  CandidateSessionScheduleParams,
  SetNullableString,
} from './useCandidateSessionSchedule.types';
import { handleScheduleConfirmError } from './useHandleScheduleConfirmError';
import { submitCandidateSchedule } from './useSubmitCandidateSchedule';

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

export function useScheduleConfirmAction({
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
  return useCallback(async () => {
    if (!validateForm()) {
      setView('scheduling');
      return;
    }
    const timezoneValue = scheduleTimezoneValue.trim();
    let scheduledStartAtUtc = '';
    try {
      scheduledStartAtUtc = localDateAtHourToUtcIso({
        dateInput: scheduleDateValue,
        timezone: timezoneValue,
      });
    } catch (err) {
      setScheduleDateError(
        (err as Error).message || 'Unable to parse start date.',
      );
      setView('scheduling');
      return;
    }
    setView('scheduleSubmitting');
    setScheduleSubmitError(null);
    markStart('candidate:schedule:submit');
    try {
      const response = await submitCandidateSchedule({
        token,
        session,
        bootstrap,
        scheduledStartAtUtc,
        timezoneValue,
        githubUsernameValue: scheduleGithubUsernameValue,
        clearScheduleErrors,
      });
      if (isScheduleLocked(response)) {
        setView('locked');
        markEnd('candidate:schedule:submit', { status: 'locked' });
        return;
      }
      setView('running');
      markEnd('candidate:schedule:submit', { status: 'success' });
    } catch (err) {
      await handleScheduleConfirmError({
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
      });
    }
  }, [
    validateForm,
    setView,
    scheduleTimezoneValue,
    scheduleDateValue,
    setScheduleDateError,
    scheduleGithubUsernameValue,
    setScheduleSubmitError,
    markStart,
    token,
    session,
    bootstrap,
    clearScheduleErrors,
    markEnd,
    redirectToLogin,
    setErrorStatus,
    setErrorMessage,
    runInit,
    setScheduleTimezoneError,
  ]);
}
