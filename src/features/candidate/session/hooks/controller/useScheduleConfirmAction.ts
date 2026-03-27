import { useCallback } from 'react';
import { isScheduleLocked, localDateAtHourToUtcIso } from '../../utils/schedule';
import type { CandidateSessionScheduleParams, SetNullableString } from './candidateSessionSchedule.types';
import { handleScheduleConfirmError } from './handleScheduleConfirmError';
import { submitCandidateSchedule } from './submitCandidateSchedule';

type Params = Pick<CandidateSessionScheduleParams, 'token' | 'bootstrap' | 'setView' | 'runInit' | 'markStart' | 'markEnd' | 'redirectToLogin' | 'setErrorStatus' | 'setErrorMessage' | 'session'> & {
  scheduleDateValue: string;
  scheduleTimezoneValue: string;
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
      scheduledStartAtUtc = localDateAtHourToUtcIso({ dateInput: scheduleDateValue, timezone: timezoneValue });
    } catch (err) {
      setScheduleDateError((err as Error).message || 'Unable to parse start date.');
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
  }, [validateForm, setView, scheduleTimezoneValue, scheduleDateValue, setScheduleDateError, setScheduleSubmitError, markStart, token, session, bootstrap, clearScheduleErrors, markEnd, redirectToLogin, setErrorStatus, setErrorMessage, runInit, setScheduleTimezoneError]);
}
