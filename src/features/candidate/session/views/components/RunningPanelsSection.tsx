import { TaskSection } from './TaskSection';
import { WorkspaceSection } from '../sections/WorkspaceSection';
import { ResourceSections } from '../ResourceSections';
import type { CandidateTask } from '../../CandidateSessionProvider';
import type { SubmitPayload, SubmitResponse } from '../../task/types';
import type { PollResult } from '../../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../../lib/windowState';

type Props = {
  currentTask: CandidateTask | null;
  candidateSessionId: number | null;
  resourceLink: string | null;
  submitting: boolean;
  showWorkspacePanel: boolean;
  showRecordingPanel: boolean;
  showDocsPanel: boolean;
  actionGate: WindowActionGate;
  taskError: string | null;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
  onRetryTask: () => void;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onDashboard: () => void;
  onTaskWindowClosed: (err: unknown) => void;
};

export function RunningPanelsSection({
  currentTask,
  candidateSessionId,
  resourceLink,
  submitting,
  showWorkspacePanel,
  showRecordingPanel,
  showDocsPanel,
  actionGate,
  taskError,
  onSubmit,
  onRetryTask,
  onStartTests,
  onPollTests,
  onDashboard,
  onTaskWindowClosed,
}: Props) {
  return (
    <>
      <WorkspaceSection
        task={currentTask}
        candidateSessionId={candidateSessionId}
        showWorkspacePanel={showWorkspacePanel}
        actionGate={actionGate}
        onStartTests={onStartTests}
        onPollTests={onPollTests}
        onTaskWindowClosed={onTaskWindowClosed}
      />

      <ResourceSections
        showRecording={showRecordingPanel}
        showDocs={showDocsPanel}
        resourceLink={resourceLink}
      />

      <TaskSection
        currentTask={currentTask}
        candidateSessionId={candidateSessionId}
        submitting={submitting}
        submitError={taskError}
        actionGate={actionGate}
        onSubmit={onSubmit}
        onRetryTask={onRetryTask}
        onDashboard={onDashboard}
      />
    </>
  );
}
