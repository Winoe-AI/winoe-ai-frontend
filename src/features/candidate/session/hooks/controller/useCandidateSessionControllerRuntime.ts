import { useCallback } from 'react';
import { useCandidateSessionActions } from '../useCandidateSessionActions';
import { useTokenSync } from '../useTokenSync';
import { useCandidateSessionSchedule } from './useCandidateSessionSchedule';
import { useCodingWorkspaceSync } from './useCodingWorkspaceSync';
import { useSubmissionTracking } from './useSubmissionTracking';
import type { UseCandidateSessionControllerRuntimeArgs } from './candidateSessionControllerRuntime.types';

export function useCandidateSessionControllerRuntime({
  token,
  session,
  sessionForActions,
  currentTask,
  currentTaskId,
  candidateSessionId,
  bootstrap,
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
}: UseCandidateSessionControllerRuntimeArgs) {
  const { codingWorkspace, onCodingWorkspaceSnapshot, resetCodingWorkspace } =
    useCodingWorkspaceSync();
  const submissionTracking = useSubmissionTracking({
    candidateSessionId,
    currentTask,
    currentTaskId,
  });

  const actions = useCandidateSessionActions({
    session: sessionForActions,
    token,
    redirectToLogin,
    onTaskWindowClosed: handleTaskWindowClosed,
    onSubmissionRecorded: submissionTracking.onSubmissionRecorded,
    view,
    setView,
    setErrorMessage,
    setErrorStatus,
    setAuthMessage,
    markStart,
    markEnd,
  });

  const schedule = useCandidateSessionSchedule({
    token,
    bootstrap,
    view,
    setView,
    runInit: actions.runInit,
    markStart,
    markEnd,
    redirectToLogin,
    setErrorStatus,
    setErrorMessage,
    detectedTimezone,
    session,
  });

  const reset = useCallback(() => {
    resetLocalState();
    submissionTracking.resetSubmissionTracking();
    resetCodingWorkspace();
    schedule.resetScheduleDraft();
    session.clearTaskError();
    if (typeof session.reset === 'function') session.reset();
  }, [resetCodingWorkspace, resetLocalState, schedule, session, submissionTracking]);

  useTokenSync({
    token,
    inviteToken: session.state.inviteToken,
    setInviteToken: session.setInviteToken,
    setCandidateSessionId: session.setCandidateSessionId,
    onReset: reset,
  });

  const handleStart = useCallback(() => {
    session.setStarted(true);
    if (!currentTask) {
      void actions.fetchCurrentTask().catch(() => setView('error'));
    }
  }, [actions, currentTask, session, setView]);

  return {
    actions,
    schedule,
    codingWorkspace,
    onCodingWorkspaceSnapshot,
    handleStart,
    ...submissionTracking,
  };
}
