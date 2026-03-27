import type { CandidateSessionScheduleParams } from './candidateSessionSchedule.types';
import { useCandidateSessionScheduleDraft } from './useCandidateSessionScheduleDraft';
import { useCandidateSessionScheduleSubmit } from './useCandidateSessionScheduleSubmit';
import { useCandidateSessionScheduleViewState } from './useCandidateSessionScheduleViewState';

export function useCandidateSessionSchedule({
  token,
  bootstrap,
  view,
  setView,
  runInit,
  markStart,
  markEnd,
  redirectToLogin,
  setErrorStatus,
  setErrorMessage,
  detectedTimezone,
  session,
}: CandidateSessionScheduleParams) {
  const draft = useCandidateSessionScheduleDraft({
    bootstrap,
    detectedTimezone,
  });

  const viewState = useCandidateSessionScheduleViewState({
    bootstrap,
    view,
    runInit,
    token,
    scheduleTimezoneValue: draft.scheduleTimezoneValue,
  });

  const submit = useCandidateSessionScheduleSubmit({
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
    scheduleDateValue: draft.scheduleDateValue,
    scheduleTimezoneValue: draft.scheduleTimezoneValue,
    validateForm: draft.validateForm,
    clearScheduleErrors: draft.clearScheduleErrors,
    setScheduleSubmitError: draft.setScheduleSubmitError,
    setScheduleTimezoneError: draft.setScheduleTimezoneError,
    setScheduleDateError: draft.setScheduleDateError,
  });

  return {
    clockNowMs: viewState.clockNowMs,
    scheduleDate: draft.scheduleDateValue,
    scheduleTimezone: draft.scheduleTimezoneValue,
    scheduleDateError: draft.scheduleDateError,
    scheduleTimezoneError: draft.scheduleTimezoneError,
    scheduleSubmitError: draft.scheduleSubmitError,
    schedulePreviewWindows: draft.schedulePreviewWindows,
    scheduleResponseWindows: viewState.scheduleResponseWindows,
    scheduleCurrentDayWindow: viewState.scheduleCurrentDayWindow,
    scheduleCountdownLabel: viewState.scheduleCountdownLabel,
    scheduleCountdownTargetAt: viewState.scheduleCountdownTargetAt,
    scheduleDisplayTimezone: viewState.scheduleDisplayTimezone,
    scheduleDisplayStartAt: viewState.scheduleDisplayStartAt,
    resetScheduleDraft: draft.resetScheduleDraft,
    onScheduleDateChange: draft.onScheduleDateChange,
    onScheduleTimezoneChange: draft.onScheduleTimezoneChange,
    onScheduleContinue: submit.onScheduleContinue,
    onScheduleBack: submit.onScheduleBack,
    onScheduleConfirm: submit.onScheduleConfirm,
    onScheduleRetry: submit.onScheduleRetry,
    onRefreshScheduleLock: submit.onRefreshScheduleLock,
  };
}
