import {
  isScheduleDateInPast,
  isValidIanaTimezone,
} from '../../utils/scheduleUtils';
import type { SetNullableString } from './useCandidateSessionSchedule.types';

type Params = {
  scheduleDateValue: string;
  scheduleTimezoneValue: string;
  scheduleTimezoneState: string | null;
  setScheduleTimezone: SetNullableString;
  setScheduleSubmitError: SetNullableString;
  setScheduleDateError: SetNullableString;
  setScheduleTimezoneError: SetNullableString;
};

export function validateScheduleDraft({
  scheduleDateValue,
  scheduleTimezoneValue,
  scheduleTimezoneState,
  setScheduleTimezone,
  setScheduleSubmitError,
  setScheduleDateError,
  setScheduleTimezoneError,
}: Params): boolean {
  const timezoneValue = scheduleTimezoneValue.trim();
  const dateValue = scheduleDateValue;
  let valid = true;

  setScheduleSubmitError(null);
  setScheduleDateError(null);
  setScheduleTimezoneError(null);

  if (!dateValue) {
    setScheduleDateError('Select a start date.');
    valid = false;
  }
  if (!timezoneValue) {
    setScheduleTimezoneError('Enter your timezone.');
    valid = false;
  } else if (!isValidIanaTimezone(timezoneValue)) {
    setScheduleTimezoneError(
      'Use a valid IANA timezone, for example America/New_York.',
    );
    valid = false;
  }
  if (
    valid &&
    isScheduleDateInPast({ dateInput: dateValue, timezone: timezoneValue })
  ) {
    setScheduleDateError('Start date cannot be in the past.');
    valid = false;
  }
  if (valid && scheduleTimezoneState !== timezoneValue) {
    setScheduleTimezone(timezoneValue);
  }
  return valid;
}
