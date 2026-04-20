import {
  isScheduleDateInPast,
  isValidIanaTimezone,
} from '../../utils/scheduleUtils';
import type { SetNullableString } from './useCandidateSessionSchedule.types';

const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/;

type Params = {
  scheduleDateValue: string;
  scheduleTimezoneValue: string;
  scheduleGithubUsernameValue: string;
  scheduleTimezoneState: string | null;
  scheduleGithubUsernameState: string | null;
  setScheduleTimezone: SetNullableString;
  setScheduleGithubUsername: SetNullableString;
  setScheduleSubmitError: SetNullableString;
  setScheduleDateError: SetNullableString;
  setScheduleTimezoneError: SetNullableString;
  setScheduleGithubUsernameError: SetNullableString;
};

export function validateScheduleDraft({
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
}: Params): boolean {
  const timezoneValue = scheduleTimezoneValue.trim();
  const githubUsernameValue = scheduleGithubUsernameValue.trim();
  const dateValue = scheduleDateValue;
  let valid = true;

  setScheduleSubmitError(null);
  setScheduleDateError(null);
  setScheduleTimezoneError(null);
  setScheduleGithubUsernameError(null);

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
  if (!githubUsernameValue) {
    setScheduleGithubUsernameError('Enter your GitHub username.');
    valid = false;
  } else if (
    githubUsernameValue.length > 39 ||
    !GITHUB_USERNAME_RE.test(githubUsernameValue)
  ) {
    setScheduleGithubUsernameError(
      'Use a valid GitHub username, for example octocat.',
    );
    valid = false;
  }
  if (valid && scheduleTimezoneState !== timezoneValue) {
    setScheduleTimezone(timezoneValue);
  }
  if (valid && scheduleGithubUsernameState !== githubUsernameValue) {
    setScheduleGithubUsername(githubUsernameValue);
  }
  return valid;
}
