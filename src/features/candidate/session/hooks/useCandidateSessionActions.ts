import { useMemo } from 'react';
import { useRunInit } from './useRunInit';
import { useTaskAutoload } from './useTaskAutoload';
import { useAuthRedirect } from './useAuthRedirect';
import { useCandidateInviteActions } from './useCandidateInviteActions';
import { useCandidateTaskActions } from './useCandidateTaskActions';
import { useCandidateTestActions } from './useCandidateTestActions';
import type { SessionActionsParams as Params } from './useCandidateSessionActions.types';

export function useCandidateSessionActions({
  session,
  token,
  redirectToLogin,
  onTaskWindowClosed,
  onSubmissionRecorded,
  view,
  setView,
  setErrorMessage,
  setErrorStatus,
  setAuthMessage,
  markStart,
  markEnd,
}: Params) {
  const taskActions = useCandidateTaskActions({
    session,
    markStart,
    markEnd,
    onTaskWindowClosed,
    onSubmissionRecorded,
  });

  const inviteActions = useCandidateInviteActions({
    token,
    session,
    redirectToLogin,
    setView,
    setAuthMessage,
    setErrorMessage,
    setErrorStatus,
    fetchCurrentTask: taskActions.fetchCurrentTask,
    markStart,
    markEnd,
  });

  const testActions = useCandidateTestActions({ session, onTaskWindowClosed });

  useRunInit(inviteActions.runInit, token);
  useTaskAutoload({
    view,
    state: session.state,
    fetchCurrentTask: taskActions.fetchCurrentTask,
    setErrorMessage,
    setView,
  });
  useAuthRedirect({
    shouldRedirect: view === 'auth',
    token,
    loginHref: inviteActions.loginHref,
  });

  return useMemo(
    () => ({
      ...taskActions,
      ...inviteActions,
      ...testActions,
    }),
    [inviteActions, taskActions, testActions],
  );
}
