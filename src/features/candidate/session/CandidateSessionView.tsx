import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { AuthView } from './views/AuthView';
import { CompleteView } from './views/CompleteView';
import { ErrorView } from './views/ErrorView';
import { LockedView } from './views/LockedView';
import { LoadingView } from './views/LoadingView';
import { SchedulingView } from './views/SchedulingView';
import { StartView } from './views/StartView';
import { StateMessage } from './components/StateMessage';
import Button from '@/shared/ui/Button';
import type {
  CandidateSessionViewProps as Props,
  ViewState,
} from './views/types';
import type { RunningViewProps } from './views/RunningView';

const LazyRunningView = dynamic<RunningViewProps>(
  () => import('./views/RunningView').then((mod) => mod.RunningView),
  {
    ssr: false,
    loading: () => <LoadingView message="Loading your simulation workspace." />,
  },
);

let RunningViewComponent: ComponentType<RunningViewProps> = LazyRunningView;

if (process.env.NODE_ENV === 'test') {
  RunningViewComponent =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('./views/RunningView') as typeof import('./views/RunningView'))
      .RunningView;
}

export type { ViewState };

export function CandidateSessionView(props: Props) {
  const {
    view,
    authStatus,
    authMessage,
    errorMessage,
    errorStatus,
    inviteErrorCopy,
  } = props;
  if (view === 'loading')
    return <LoadingView message="Checking your invite and signing you in." />;
  if (view === 'auth')
    return <AuthView loginHref={props.loginHref} message={authMessage} />;
  if (view === 'accessDenied')
    return (
      <StateMessage
        title="Access denied"
        description={
          errorMessage ??
          'You do not have access to this invite. Please confirm you are signed in with the matching email.'
        }
        action={
          <a href={props.loginHref}>
            <Button variant="secondary">Go to sign in</Button>
          </a>
        }
      />
    );
  if (view === 'expired')
    return (
      <StateMessage
        title="Invite expired"
        description={
          errorMessage ??
          'This invite has expired. Please contact your recruiter for a new link.'
        }
      />
    );
  if (
    view === 'scheduling' ||
    view === 'scheduleConfirm' ||
    view === 'scheduleSubmitting'
  )
    return (
      <SchedulingView
        title={props.title}
        role={props.role}
        step={
          view === 'scheduling'
            ? 'form'
            : view === 'scheduleSubmitting'
              ? 'submitting'
              : 'confirm'
        }
        scheduleDate={props.scheduleDate}
        scheduleTimezone={props.scheduleTimezone}
        scheduleTimezoneDetected={props.scheduleTimezoneDetected}
        scheduleTimezoneOptions={props.scheduleTimezoneOptions}
        scheduleDateError={props.scheduleDateError}
        scheduleTimezoneError={props.scheduleTimezoneError}
        scheduleSubmitError={props.scheduleSubmitError}
        schedulePreviewWindows={props.schedulePreviewWindows}
        onScheduleDateChange={props.onScheduleDateChange}
        onScheduleTimezoneChange={props.onScheduleTimezoneChange}
        onScheduleContinue={props.onScheduleContinue}
        onScheduleBack={props.onScheduleBack}
        onScheduleConfirm={props.onScheduleConfirm}
        onScheduleRetry={props.onScheduleRetry}
        onDashboard={props.onDashboard}
      />
    );
  if (view === 'locked')
    return (
      <LockedView
        title={props.title}
        role={props.role}
        countdownLabel={props.scheduleCountdownLabel}
        countdownTargetAt={props.scheduleCountdownTargetAt}
        timezone={props.scheduleDisplayTimezone}
        scheduledStartAt={props.scheduleDisplayStartAt}
        dayWindows={props.scheduleResponseWindows}
        currentDayWindow={props.scheduleCurrentDayWindow}
        errorMessage={props.scheduleSubmitError}
        onRetry={props.onRefreshScheduleLock}
      />
    );
  if (view === 'starting')
    return <LoadingView message="Loading your tasks and workspace." />;

  if (view === 'error') {
    const inviteLinkError = [400, 404, 409, 410].includes(errorStatus ?? 0);
    const errorTitle = inviteLinkError
      ? 'Invite link unavailable'
      : 'Unable to load simulation';
    const errorCopy = inviteLinkError
      ? inviteErrorCopy
      : (errorMessage ?? 'Something went wrong loading your simulation.');
    return (
      <ErrorView
        authStatus={authStatus}
        errorTitle={errorTitle}
        errorCopy={errorCopy}
        inviteLinkError={inviteLinkError}
        loginHref={props.loginHref}
        onRetry={props.onRetryInit}
        onGoHome={props.onGoHome}
      />
    );
  }

  if (props.isComplete) return <CompleteView />;
  if (!props.started)
    return (
      <StartView
        title={props.title}
        role={props.role}
        onStart={props.onStart}
        onDashboard={props.onDashboard}
      />
    );

  return (
    <RunningViewComponent
      title={props.title}
      role={props.role}
      completedCount={props.completedCount}
      currentDayIndex={props.currentDayIndex}
      currentTask={props.currentTask}
      candidateSessionId={props.candidateSessionId}
      taskError={props.taskError}
      taskLoading={props.taskLoading}
      resourceLink={props.resourceLink}
      submitting={props.submitting}
      showWorkspacePanel={props.showWorkspacePanel}
      showRecordingPanel={props.showRecordingPanel}
      showDocsPanel={props.showDocsPanel}
      windowState={props.windowState}
      actionGate={props.actionGate}
      codingWorkspace={props.codingWorkspace}
      lastDraftSavedAt={props.lastDraftSavedAt}
      lastSubmissionAt={props.lastSubmissionAt}
      lastSubmissionId={props.lastSubmissionId}
      onRetryTask={props.onRetryTask}
      onSubmit={props.onSubmit}
      onStartTests={props.onStartTests}
      onPollTests={props.onPollTests}
      onDashboard={props.onDashboard}
      onTaskWindowClosed={props.onTaskWindowClosed}
      onCodingWorkspaceSnapshot={props.onCodingWorkspaceSnapshot}
    />
  );
}
