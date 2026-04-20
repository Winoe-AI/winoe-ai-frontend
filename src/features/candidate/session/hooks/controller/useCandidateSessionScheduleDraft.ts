import { useCallback, useMemo, useState } from 'react';
import {
  buildSchedulePreview,
  isValidIanaTimezone,
  toDateInputInTimezone,
} from '../../utils/scheduleUtils';
import type { CandidateSessionScheduleParams } from './useCandidateSessionSchedule.types';
import { validateScheduleDraft } from './useValidateScheduleDraft';
type Params = Pick<
  CandidateSessionScheduleParams,
  'bootstrap' | 'detectedTimezone'
>;

export function useCandidateSessionScheduleDraft({
  bootstrap,
  detectedTimezone,
}: Params) {
  const [scheduleDateState, setScheduleDate] = useState<string | null>(null);
  const [scheduleTimezoneState, setScheduleTimezone] = useState<string | null>(
    null,
  );
  const [scheduleGithubUsernameState, setScheduleGithubUsername] = useState<
    string | null
  >(null);
  const [scheduleDateError, setScheduleDateError] = useState<string | null>(
    null,
  );
  const [scheduleTimezoneError, setScheduleTimezoneError] = useState<
    string | null
  >(null);
  const [scheduleGithubUsernameError, setScheduleGithubUsernameError] =
    useState<string | null>(null);
  const [scheduleSubmitError, setScheduleSubmitError] = useState<string | null>(
    null,
  );

  const scheduleTimezoneValue =
    scheduleTimezoneState ??
    bootstrap?.candidateTimezone ??
    detectedTimezone ??
    '';
  const scheduleGithubUsernameValue =
    scheduleGithubUsernameState ?? bootstrap?.githubUsername ?? '';
  const bootstrapScheduleDate =
    bootstrap?.scheduledStartAt && scheduleTimezoneValue
      ? toDateInputInTimezone(bootstrap.scheduledStartAt, scheduleTimezoneValue)
      : null;
  const scheduleDateValue = scheduleDateState ?? bootstrapScheduleDate ?? '';

  const clearScheduleErrors = useCallback(() => {
    setScheduleDateError(null);
    setScheduleTimezoneError(null);
    setScheduleGithubUsernameError(null);
    setScheduleSubmitError(null);
  }, []);

  const resetScheduleDraft = useCallback(() => {
    setScheduleDate(null);
    setScheduleTimezone(null);
    setScheduleGithubUsername(null);
    clearScheduleErrors();
  }, [clearScheduleErrors]);

  const schedulePreviewWindows = useMemo(() => {
    const timezoneValue = scheduleTimezoneValue.trim();
    if (!scheduleDateValue || !isValidIanaTimezone(timezoneValue)) return [];
    try {
      return buildSchedulePreview({
        dateInput: scheduleDateValue,
        timezone: timezoneValue,
      });
    } catch {
      return [];
    }
  }, [scheduleDateValue, scheduleTimezoneValue]);

  const validateForm = useCallback(
    () =>
      validateScheduleDraft({
        scheduleDateValue,
        scheduleTimezoneValue,
        scheduleGithubUsernameValue,
        scheduleTimezoneState,
        scheduleGithubUsernameState,
        setScheduleTimezone,
        setScheduleGithubUsername,
        setScheduleSubmitError,
        setScheduleDateError,
        setScheduleTimezoneError,
        setScheduleGithubUsernameError,
      }),
    [
      scheduleDateValue,
      scheduleGithubUsernameState,
      scheduleGithubUsernameValue,
      scheduleTimezoneState,
      scheduleTimezoneValue,
      setScheduleTimezone,
      setScheduleGithubUsername,
      setScheduleSubmitError,
      setScheduleDateError,
      setScheduleTimezoneError,
      setScheduleGithubUsernameError,
    ],
  );

  const onScheduleDateChange = useCallback((value: string) => {
    setScheduleDate(value);
    setScheduleDateError(null);
    setScheduleSubmitError(null);
  }, []);

  const onScheduleTimezoneChange = useCallback((value: string) => {
    setScheduleTimezone(value);
    setScheduleTimezoneError(null);
    setScheduleSubmitError(null);
  }, []);

  const onScheduleGithubUsernameChange = useCallback((value: string) => {
    setScheduleGithubUsername(value);
    setScheduleGithubUsernameError(null);
    setScheduleSubmitError(null);
  }, []);

  return {
    scheduleDateValue,
    scheduleTimezoneValue,
    scheduleGithubUsernameValue,
    scheduleDateError,
    scheduleTimezoneError,
    scheduleGithubUsernameError,
    scheduleSubmitError,
    schedulePreviewWindows,
    setScheduleDateError,
    setScheduleTimezoneError,
    setScheduleGithubUsernameError,
    setScheduleSubmitError,
    clearScheduleErrors,
    resetScheduleDraft,
    validateForm,
    onScheduleDateChange,
    onScheduleTimezoneChange,
    onScheduleGithubUsernameChange,
  };
}
