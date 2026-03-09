import { TaskSection } from './TaskSection';
import { WorkspaceSection } from '../sections/WorkspaceSection';
import { ResourceSections } from '../ResourceSections';
import type { CandidateTask } from '../../CandidateSessionProvider';
import type { SubmitPayload, SubmitResponse } from '../../task/types';
import type { PollResult } from '../../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '../../task/utils/codingWorkspace';

type Props = {
  currentTask: CandidateTask | null;
  candidateSessionId: number | null;
  resourceLink: string | null;
  submitting: boolean;
  showWorkspacePanel: boolean;
  showRecordingPanel: boolean;
  showDocsPanel: boolean;
  actionGate: WindowActionGate;
  codingWorkspace?: CodingWorkspace | null;
  taskError: string | null;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
  onRetryTask: () => void;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onDashboard: () => void;
  onTaskWindowClosed: (err: unknown) => void;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
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
  codingWorkspace,
  taskError,
  onSubmit,
  onRetryTask,
  onStartTests,
  onPollTests,
  onDashboard,
  onTaskWindowClosed,
  onCodingWorkspaceSnapshot,
}: Props) {
  return (
    <>
      <WorkspaceSection
        task={currentTask}
        candidateSessionId={candidateSessionId}
        showWorkspacePanel={showWorkspacePanel}
        actionGate={actionGate}
        codingWorkspace={codingWorkspace}
        onStartTests={onStartTests}
        onPollTests={onPollTests}
        onTaskWindowClosed={onTaskWindowClosed}
        onCodingWorkspaceSnapshot={onCodingWorkspaceSnapshot}
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
        onTaskWindowClosed={onTaskWindowClosed}
        onSubmit={onSubmit}
        onRetryTask={onRetryTask}
        onDashboard={onDashboard}
      />
    </>
  );
}
