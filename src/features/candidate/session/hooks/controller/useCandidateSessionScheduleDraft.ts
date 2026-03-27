import { useCallback, useMemo, useState } from 'react';
import { buildSchedulePreview, isValidIanaTimezone, toDateInputInTimezone } from '../../utils/schedule';
import type { CandidateSessionScheduleParams } from './candidateSessionSchedule.types';
import { validateScheduleDraft } from './validateScheduleDraft';
type Params = Pick<CandidateSessionScheduleParams, 'bootstrap' | 'detectedTimezone'>;

export function useCandidateSessionScheduleDraft({
  bootstrap,
  detectedTimezone,
}: Params) {
  const [scheduleDateState, setScheduleDate] = useState<string | null>(null);
  const [scheduleTimezoneState, setScheduleTimezone] = useState<string | null>(
    null,
  );
  const [scheduleDateError, setScheduleDateError] = useState<string | null>(null);
  const [scheduleTimezoneError, setScheduleTimezoneError] = useState<
    string | null
  >(null);
  const [scheduleSubmitError, setScheduleSubmitError] = useState<string | null>(
    null,
  );

  const scheduleTimezoneValue =
    scheduleTimezoneState ?? bootstrap?.candidateTimezone ?? detectedTimezone ?? '';
  const bootstrapScheduleDate =
    bootstrap?.scheduledStartAt && scheduleTimezoneValue
      ? toDateInputInTimezone(bootstrap.scheduledStartAt, scheduleTimezoneValue)
      : null;
  const scheduleDateValue = scheduleDateState ?? bootstrapScheduleDate ?? '';

  const clearScheduleErrors = useCallback(() => {
    setScheduleDateError(null);
    setScheduleTimezoneError(null);
    setScheduleSubmitError(null);
  }, []);

  const resetScheduleDraft = useCallback(() => {
    setScheduleDate(null);
    setScheduleTimezone(null);
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
        scheduleTimezoneState,
        setScheduleTimezone,
        setScheduleSubmitError,
        setScheduleDateError,
        setScheduleTimezoneError,
      }),
    [scheduleDateValue, scheduleTimezoneState, scheduleTimezoneValue],
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

  return {
    scheduleDateValue,
    scheduleTimezoneValue,
    scheduleDateError,
    scheduleTimezoneError,
    scheduleSubmitError,
    schedulePreviewWindows,
    setScheduleDateError,
    setScheduleTimezoneError,
    setScheduleSubmitError,
    clearScheduleErrors,
    resetScheduleDraft,
    validateForm,
    onScheduleDateChange,
    onScheduleTimezoneChange,
  };
}
