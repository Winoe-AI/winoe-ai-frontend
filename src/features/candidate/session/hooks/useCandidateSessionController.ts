import { useMemo } from 'react';
import { useCandidateSession } from '../CandidateSessionProvider';
import { usePerfMarks } from './usePerfMarks';
import { useCandidateDerivedInfo } from './useCandidateDerivedInfo';
import { useWindowState } from './useWindowState';
import {
  detectBrowserTimezone,
  supportedTimezones,
} from '../utils/scheduleUtils';
import { buildCandidateSessionControllerResult } from './controller/useBuildCandidateSessionControllerResult';
import { useCandidateSessionControllerLocalState } from './controller/useCandidateSessionControllerLocalState';
import { useCandidateSessionControllerNavigation } from './controller/useCandidateSessionControllerNavigation';
import { useCandidateSessionControllerRuntime } from './controller/useCandidateSessionControllerRuntime';
import { useCandidateSessionScopedState } from './controller/useCandidateSessionScopedState';
import { resolveCandidateSessionView } from './controller/useResolveCandidateSessionView';
export function useCandidateSessionController(token: string) {
  const session = useCandidateSession();
  const {
    state,
    sessionForActions,
    candidateSessionId,
    currentTask,
    currentTaskId,
  } = useCandidateSessionScopedState(session, token);
  const { loginHref, redirectToLogin, onDashboard, onGoHome } =
    useCandidateSessionControllerNavigation(token);
  const { markStart, markEnd } = usePerfMarks();
  const detectedTimezone = useMemo(() => detectBrowserTimezone(), []);
  const timezoneOptions = useMemo(() => supportedTimezones(), []);
  const {
    view,
    setView,
    errorMessage,
    setErrorMessage,
    errorStatus,
    setErrorStatus,
    authMessage,
    setAuthMessage,
    taskWindowOverride,
    handleTaskWindowClosed,
    resetLocalState,
  } = useCandidateSessionControllerLocalState(currentTaskId);
  const runtime = useCandidateSessionControllerRuntime({
    token,
    session,
    sessionForActions,
    currentTask,
    currentTaskId,
    candidateSessionId,
    bootstrap: state.bootstrap,
    redirectToLogin,
    detectedTimezone,
    view,
    setView,
    setErrorMessage,
    setErrorStatus,
    setAuthMessage,
    handleTaskWindowClosed,
    resetLocalState,
    markStart,
    markEnd,
  });
  const derived = useCandidateDerivedInfo(state, errorStatus, errorMessage, {
    currentTask,
  });
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
  const finalView = resolveCandidateSessionView({
    view,
    hasTaskData: state.taskState.isComplete || Boolean(currentTask),
    bootstrap: state.bootstrap,
    scheduleResponseWindowCount:
      runtime.schedule.scheduleResponseWindows.length,
    clockNowMs: runtime.schedule.clockNowMs,
  });
  return buildCandidateSessionControllerResult({
    finalView,
    state,
    authMessage,
    errorMessage,
    errorStatus,
    loginHref,
    derived,
    actions: runtime.actions,
    candidateSessionId,
    schedule: runtime.schedule,
    detectedTimezone,
    timezoneOptions,
    windowState,
    codingWorkspace: runtime.codingWorkspace,
    lastDraftSavedAt: runtime.lastDraftSavedAt,
    lastSubmissionAt: runtime.lastSubmissionAt,
    lastSubmissionId: runtime.lastSubmissionId,
    onStart: runtime.handleStart,
    onDashboard,
    onGoHome,
    token,
    onTaskWindowClosed: handleTaskWindowClosed,
    onCodingWorkspaceSnapshot: runtime.onCodingWorkspaceSnapshot,
  });
}
