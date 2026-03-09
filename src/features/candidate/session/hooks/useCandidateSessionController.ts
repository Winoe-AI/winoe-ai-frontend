import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildLoginHref } from '@/features/auth/authPaths';
import { scheduleCandidateSession } from '@/features/candidate/api';
import { useCandidateSession } from '../CandidateSessionProvider';
import { usePerfMarks } from './usePerfMarks';
import { useCandidateDerivedInfo } from './useCandidateDerivedInfo';
import { useTokenSync } from './useTokenSync';
import { useCandidateSessionActions } from './useCandidateSessionActions';
import { friendlyTaskError } from '../utils/errorMessages';
import { loadTextDraftSavedAt } from '../task/utils/draftStorage';
import {
  loadRecordedSubmissionReference,
  saveRecordedSubmissionReference,
} from '../task/utils/submissionReferenceStorage';
import { useWindowState } from './useWindowState';
import {
  extractTaskWindowClosedOverride,
  type TaskWindowClosedOverride,
} from '../lib/windowState';
import {
  buildSchedulePreview,
  countdownFromUtc,
  detectBrowserTimezone,
  firstWindowStartAt,
  formatCountdown,
  hasScheduleConfigured,
  isScheduleDateInPast,
  isScheduleLocked,
  isValidIanaTimezone,
  localDateAtHourToUtcIso,
  normalizeDayWindows,
  supportedTimezones,
  toDateInputInTimezone,
} from '../utils/schedule';
import {
  areWorkspaceStatusesEqual,
  getCodingWorkspace,
  type CodingWorkspaceSnapshot,
} from '../task/utils/codingWorkspace';
import type { ViewState } from '../CandidateSessionView';

function scheduleErrorCode(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null;
  const details = (err as { details?: unknown }).details;
  if (!details || typeof details !== 'object') return null;
  const record = details as Record<string, unknown>;
  if (typeof record.errorCode === 'string' && record.errorCode.trim())
    return record.errorCode.trim();
  if (typeof record.code === 'string' && record.code.trim())
    return record.code.trim();
  return null;
}

export function useCandidateSessionController(token: string) {
  const session = useCandidateSession();
  const sessionTokenMismatch =
    session.state.inviteToken !== null && session.state.inviteToken !== token;
  const state = useMemo(
    () =>
      sessionTokenMismatch
        ? {
            ...session.state,
            candidateSessionId: null,
            bootstrap: null,
            started: false,
            taskState: {
              loading: false,
              error: null,
              isComplete: false,
              completedTaskIds: [],
              currentTask: null,
            },
          }
        : session.state,
    [session.state, sessionTokenMismatch],
  );
  const sessionForActions = useMemo(
    () => (sessionTokenMismatch ? { ...session, state } : session),
    [session, sessionTokenMismatch, state],
  );
  const router = useRouter();
  const loginHref = useMemo(
    () =>
      buildLoginHref(
        `/candidate/session/${encodeURIComponent(token)}`,
        'candidate',
      ),
    [token],
  );
  const redirectToLogin = useCallback(() => {
    router.replace(loginHref);
  }, [loginHref, router]);
  const { markStart, markEnd } = usePerfMarks();
  const detectedTimezone = useMemo(() => detectBrowserTimezone(), []);
  const timezoneOptions = useMemo(() => supportedTimezones(), []);
  const [view, setView] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);
  const [scheduleTimezone, setScheduleTimezone] = useState<string | null>(null);
  const [scheduleDateError, setScheduleDateError] = useState<string | null>(
    null,
  );
  const [scheduleTimezoneError, setScheduleTimezoneError] = useState<
    string | null
  >(null);
  const [scheduleSubmitError, setScheduleSubmitError] = useState<string | null>(
    null,
  );
  const [taskWindowOverride, setTaskWindowOverride] = useState<{
    taskId: number;
    value: TaskWindowClosedOverride;
  } | null>(null);
  const [lastSubmissionAt, setLastSubmissionAt] = useState<string | null>(null);
  const [lastSubmissionId, setLastSubmissionId] = useState<number | null>(null);
  const [lastSubmissionTaskId, setLastSubmissionTaskId] = useState<
    number | null
  >(null);
  const [clockNowMs, setClockNowMs] = useState<number>(() => Date.now());
  const [codingWorkspaceByDay, setCodingWorkspaceByDay] = useState<{
    day2: CodingWorkspaceSnapshot['workspace'];
    day3: CodingWorkspaceSnapshot['workspace'];
  }>({
    day2: null,
    day3: null,
  });
  const unlockRefreshRef = useRef<string | null>(null);
  const candidateSessionId = state.candidateSessionId ?? null;
  const currentTaskId = state.taskState.currentTask?.id ?? null;

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

  const reset = useCallback(() => {
    setErrorMessage(null);
    setErrorStatus(null);
    setAuthMessage(null);
    setView('loading');
    setTaskWindowOverride(null);
    setLastSubmissionAt(null);
    setLastSubmissionId(null);
    setLastSubmissionTaskId(null);
    setCodingWorkspaceByDay({ day2: null, day3: null });
    resetScheduleDraft();
    session.clearTaskError();
    if (typeof session.reset === 'function') session.reset();
  }, [resetScheduleDraft, session]);

  const handleCodingWorkspaceSnapshot = useCallback(
    (snapshot: CodingWorkspaceSnapshot) => {
      const dayKey = snapshot.dayIndex === 2 ? 'day2' : 'day3';
      setCodingWorkspaceByDay((prev) => {
        if (areWorkspaceStatusesEqual(prev[dayKey], snapshot.workspace))
          return prev;
        return { ...prev, [dayKey]: snapshot.workspace };
      });
    },
    [],
  );

  const handleTaskWindowClosed = useCallback(
    (err: unknown) => {
      if (!currentTaskId) return;
      const override = extractTaskWindowClosedOverride(err);
      if (!override) return;
      setTaskWindowOverride({ taskId: currentTaskId, value: override });
    },
    [currentTaskId],
  );

  const handleSubmissionRecorded = useCallback(
    (payload: { submissionId: number; submittedAt: string }) => {
      if (!currentTaskId) return;
      setLastSubmissionTaskId(currentTaskId);
      setLastSubmissionId(payload.submissionId);
      setLastSubmissionAt(payload.submittedAt);
      if (candidateSessionId !== null) {
        saveRecordedSubmissionReference(candidateSessionId, currentTaskId, {
          submissionId: payload.submissionId,
          submittedAt: payload.submittedAt,
        });
      }
    },
    [candidateSessionId, currentTaskId],
  );

  useTokenSync({
    token,
    inviteToken: session.state.inviteToken,
    setInviteToken: session.setInviteToken,
    setCandidateSessionId: session.setCandidateSessionId,
    onReset: reset,
  });

  const actions = useCandidateSessionActions({
    session: sessionForActions,
    token,
    redirectToLogin,
    onTaskWindowClosed: handleTaskWindowClosed,
    onSubmissionRecorded: handleSubmissionRecorded,
    view,
    setView,
    setErrorMessage,
    setErrorStatus,
    setAuthMessage,
    markStart,
    markEnd,
  });

  useEffect(() => {
    if (view !== 'locked') return;
    const timer = window.setInterval(() => setClockNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [view]);

  const bootstrapScheduleTimezone = state.bootstrap?.candidateTimezone ?? null;
  const scheduleTimezoneValue =
    scheduleTimezone ?? bootstrapScheduleTimezone ?? detectedTimezone ?? '';
  const bootstrapScheduleDate =
    state.bootstrap?.scheduledStartAt && scheduleTimezoneValue
      ? toDateInputInTimezone(
          state.bootstrap.scheduledStartAt,
          scheduleTimezoneValue,
        )
      : null;
  const scheduleDateValue = scheduleDate ?? bootstrapScheduleDate ?? '';

  const scheduleResponseWindows = useMemo(
    () => normalizeDayWindows(state.bootstrap?.dayWindows),
    [state.bootstrap?.dayWindows],
  );
  const scheduleCurrentDayWindow = state.bootstrap?.currentDayWindow ?? null;
  const scheduleCountdownTargetAt = firstWindowStartAt({
    scheduledStartAt: state.bootstrap?.scheduledStartAt,
    dayWindows: state.bootstrap?.dayWindows,
    currentDayWindow: scheduleCurrentDayWindow,
  });
  const scheduleCountdown = useMemo(
    () => countdownFromUtc(scheduleCountdownTargetAt, clockNowMs),
    [clockNowMs, scheduleCountdownTargetAt],
  );
  const scheduleCountdownLabel = useMemo(
    () => formatCountdown(scheduleCountdown),
    [scheduleCountdown],
  );
  const fallbackTimezone = scheduleTimezoneValue.trim();
  const scheduleDisplayTimezone =
    state.bootstrap?.candidateTimezone ??
    (fallbackTimezone ? fallbackTimezone : null);
  const scheduleDisplayStartAt = state.bootstrap?.scheduledStartAt ?? null;

  useEffect(() => {
    if (view !== 'locked') {
      unlockRefreshRef.current = null;
      return;
    }
    if (!scheduleCountdown.complete) return;
    const key = scheduleCountdownTargetAt ?? 'immediate';
    if (unlockRefreshRef.current === key) return;
    unlockRefreshRef.current = key;
    void actions.runInit(token, true);
  }, [
    actions,
    scheduleCountdown.complete,
    scheduleCountdownTargetAt,
    token,
    view,
  ]);

  const schedulePreviewWindows = useMemo(() => {
    if (
      !scheduleDateValue ||
      !isValidIanaTimezone(scheduleTimezoneValue.trim())
    )
      return [];
    try {
      return buildSchedulePreview({
        dateInput: scheduleDateValue,
        timezone: scheduleTimezoneValue.trim(),
      });
    } catch {
      return [];
    }
  }, [scheduleDateValue, scheduleTimezoneValue]);

  const validateScheduleForm = useCallback(() => {
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
    if (valid) {
      if (
        isScheduleDateInPast({
          dateInput: dateValue,
          timezone: timezoneValue,
        })
      ) {
        setScheduleDateError('Start date cannot be in the past.');
        valid = false;
      }
    }
    if (valid && scheduleTimezone !== timezoneValue)
      setScheduleTimezone(timezoneValue);
    return valid;
  }, [scheduleDateValue, scheduleTimezone, scheduleTimezoneValue]);

  const handleScheduleContinue = useCallback(() => {
    if (!validateScheduleForm()) return;
    setView('scheduleConfirm');
  }, [validateScheduleForm]);

  const handleScheduleBack = useCallback(() => {
    clearScheduleErrors();
    setView('scheduling');
  }, [clearScheduleErrors]);

  const handleScheduleConfirm = useCallback(async () => {
    if (!validateScheduleForm()) {
      setView('scheduling');
      return;
    }
    const timezoneValue = scheduleTimezoneValue.trim();
    const dateValue = scheduleDateValue;
    let scheduledStartAtUtc: string;
    try {
      scheduledStartAtUtc = localDateAtHourToUtcIso({
        dateInput: dateValue,
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
      const response = await scheduleCandidateSession(token, {
        scheduledStartAt: scheduledStartAtUtc,
        candidateTimezone: timezoneValue,
      });
      const current = state.bootstrap;
      session.setBootstrap({
        candidateSessionId: response.candidateSessionId,
        status: current?.status ?? 'in_progress',
        simulation: current?.simulation ?? { title: '', role: '' },
        scheduledStartAt: response.scheduledStartAt,
        candidateTimezone: response.candidateTimezone,
        dayWindows: response.dayWindows,
        scheduleLockedAt: response.scheduleLockedAt,
        currentDayWindow: null,
      });
      clearScheduleErrors();
      if (
        isScheduleLocked({
          scheduledStartAt: response.scheduledStartAt,
          candidateTimezone: response.candidateTimezone,
          dayWindows: response.dayWindows,
        })
      ) {
        setView('locked');
        markEnd('candidate:schedule:submit', { status: 'locked' });
        return;
      }
      setView('starting');
      markEnd('candidate:schedule:submit', { status: 'success' });
      await actions
        .fetchCurrentTask(undefined, { skipCache: true })
        .then(() => setView('running'))
        .catch((err) => {
          setErrorMessage(friendlyTaskError(err));
          setView('error');
        });
    } catch (err) {
      const status =
        err &&
        typeof err === 'object' &&
        typeof (err as { status?: unknown }).status === 'number'
          ? ((err as { status: number }).status ?? null)
          : null;
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

      if (status === 401) {
        redirectToLogin();
        return;
      }
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
        await actions.runInit(token, true);
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
  }, [
    actions,
    clearScheduleErrors,
    markEnd,
    markStart,
    redirectToLogin,
    scheduleDateValue,
    scheduleTimezoneValue,
    session,
    state.bootstrap,
    token,
    validateScheduleForm,
  ]);

  const handleScheduleRetry = useCallback(() => {
    setScheduleSubmitError(null);
    void actions.runInit(token, true);
  }, [actions, token]);

  const handleRefreshScheduleLock = useCallback(() => {
    setScheduleSubmitError(null);
    void actions.runInit(token, true);
  }, [actions, token]);

  const handleStart = useCallback(() => {
    session.setStarted(true);
    if (!state.taskState.currentTask) {
      void actions.fetchCurrentTask().catch(() => setView('error'));
    }
  }, [actions, session, state.taskState.currentTask]);

  const derived = useCandidateDerivedInfo(state, errorStatus, errorMessage);

  const windowState = useWindowState({
    dayWindows: state.bootstrap?.dayWindows,
    currentDayIndex: derived.currentDayIndex,
    currentDayWindow: state.bootstrap?.currentDayWindow ?? null,
    override:
      currentTaskId !== null &&
      taskWindowOverride &&
      taskWindowOverride.taskId === currentTaskId
        ? taskWindowOverride.value
        : null,
  });
  const lastDraftSavedAt =
    currentTaskId !== null ? loadTextDraftSavedAt(currentTaskId) : null;
  const inMemorySubmission =
    currentTaskId !== null && lastSubmissionTaskId === currentTaskId
      ? { submittedAt: lastSubmissionAt, submissionId: lastSubmissionId }
      : null;
  const canonicalSubmission =
    state.taskState.currentTask?.recordedSubmission ?? null;
  const canonicalSubmissionId = canonicalSubmission?.submissionId ?? null;
  const canonicalSubmittedAt = canonicalSubmission?.submittedAt ?? null;
  const storedSubmission =
    candidateSessionId !== null && currentTaskId !== null
      ? loadRecordedSubmissionReference(candidateSessionId, currentTaskId)
      : null;
  const activeSubmission =
    canonicalSubmission ?? inMemorySubmission ?? storedSubmission;

  useEffect(() => {
    if (canonicalSubmissionId === null || !canonicalSubmittedAt) return;
    if (candidateSessionId === null || currentTaskId === null) return;
    saveRecordedSubmissionReference(candidateSessionId, currentTaskId, {
      submissionId: canonicalSubmissionId,
      submittedAt: canonicalSubmittedAt,
    });
  }, [
    candidateSessionId,
    canonicalSubmissionId,
    canonicalSubmittedAt,
    currentTaskId,
  ]);

  const resolvedView: ViewState =
    (view === 'loading' || view === 'starting') &&
    (state.taskState.isComplete || state.taskState.currentTask)
      ? 'running'
      : view;

  const hasSchedule =
    hasScheduleConfigured(state.bootstrap) ||
    (state.bootstrap?.scheduledStartAt != null &&
      state.bootstrap?.candidateTimezone != null &&
      scheduleResponseWindows.length > 0);
  const lockEligibleViews: ViewState[] = [
    'loading',
    'starting',
    'running',
    'scheduling',
    'scheduleConfirm',
    'scheduleSubmitting',
  ];
  const shouldKeepLocked =
    resolvedView !== 'locked' &&
    lockEligibleViews.includes(resolvedView) &&
    hasSchedule &&
    isScheduleLocked(
      {
        scheduledStartAt: state.bootstrap?.scheduledStartAt,
        candidateTimezone: state.bootstrap?.candidateTimezone,
        dayWindows: state.bootstrap?.dayWindows,
        currentDayWindow: state.bootstrap?.currentDayWindow ?? null,
      },
      clockNowMs,
    );
  const finalView: ViewState = shouldKeepLocked ? 'locked' : resolvedView;
  const codingWorkspace = useMemo(
    () =>
      getCodingWorkspace({
        day2Workspace: codingWorkspaceByDay.day2,
        day3Workspace: codingWorkspaceByDay.day3,
      }),
    [codingWorkspaceByDay.day2, codingWorkspaceByDay.day3],
  );

  return {
    view: finalView,
    authStatus: state.authStatus,
    authMessage,
    errorMessage,
    errorStatus,
    loginHref,
    ...derived,
    started: state.started,
    submitting: actions.submitting,
    taskError: state.taskState.error,
    candidateSessionId,
    taskLoading: state.taskState.loading,
    scheduleDate: scheduleDateValue,
    scheduleTimezone: scheduleTimezoneValue,
    scheduleTimezoneDetected: detectedTimezone,
    scheduleTimezoneOptions: timezoneOptions,
    scheduleDateError,
    scheduleTimezoneError,
    scheduleSubmitError,
    schedulePreviewWindows,
    scheduleResponseWindows,
    scheduleCurrentDayWindow,
    scheduleCountdownLabel,
    scheduleCountdownTargetAt,
    scheduleDisplayTimezone,
    scheduleDisplayStartAt,
    windowState,
    actionGate: windowState.actionGate,
    codingWorkspace,
    lastDraftSavedAt,
    lastSubmissionAt: activeSubmission?.submittedAt ?? null,
    lastSubmissionId: activeSubmission?.submissionId ?? null,
    onStart: handleStart,
    onDashboard: () => router.push('/candidate/dashboard'),
    onRetryInit: () => actions.runInit(token, true),
    onGoHome: () => router.push('/'),
    onRetryTask: () => actions.fetchCurrentTask(undefined, { skipCache: true }),
    onScheduleDateChange: (value: string) => {
      setScheduleDate(value);
      setScheduleDateError(null);
      setScheduleSubmitError(null);
    },
    onScheduleTimezoneChange: (value: string) => {
      setScheduleTimezone(value);
      setScheduleTimezoneError(null);
      setScheduleSubmitError(null);
    },
    onScheduleContinue: handleScheduleContinue,
    onScheduleBack: handleScheduleBack,
    onScheduleConfirm: () => {
      void handleScheduleConfirm();
    },
    onScheduleRetry: handleScheduleRetry,
    onRefreshScheduleLock: handleRefreshScheduleLock,
    onSubmit: actions.handleSubmit,
    onStartTests: actions.handleStartTests,
    onPollTests: actions.handlePollTests,
    onTaskWindowClosed: handleTaskWindowClosed,
    onCodingWorkspaceSnapshot: handleCodingWorkspaceSnapshot,
  };
}
