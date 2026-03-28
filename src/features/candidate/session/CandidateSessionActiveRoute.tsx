import type { ComponentType } from 'react';
import { CompleteView } from './views/CompleteView';
import { StartView } from './views/StartView';
import type { CandidateSessionViewProps as Props } from './views/types';
import type { RunningViewProps } from './views/RunningView';

type CandidateSessionActiveRouteProps = {
  props: Props;
  RunningViewComponent: ComponentType<RunningViewProps>;
};

export function CandidateSessionActiveRoute({
  props,
  RunningViewComponent,
}: CandidateSessionActiveRouteProps) {
  if (props.isComplete) return <CompleteView />;
  if (!props.started) {
    return (
      <StartView
        title={props.title}
        role={props.role}
        onStart={props.onStart}
        onDashboard={props.onDashboard}
      />
    );
  }

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
