import { WorkspaceAndTests } from '../WorkspaceAndTests';
import type { CandidateTask } from '../../CandidateSessionProvider';
import type { PollResult } from '../../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '../../task/utils/codingWorkspace';

type Props = {
  task: CandidateTask | null;
  candidateSessionId: number | null;
  showWorkspacePanel: boolean;
  actionGate: WindowActionGate;
  codingWorkspace?: CodingWorkspace | null;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onTaskWindowClosed: (err: unknown) => void;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};

export function WorkspaceSection({
  task,
  candidateSessionId,
  showWorkspacePanel,
  actionGate,
  codingWorkspace,
  onStartTests,
  onPollTests,
  onTaskWindowClosed,
  onCodingWorkspaceSnapshot,
}: Props) {
  if (!showWorkspacePanel || candidateSessionId === null || !task) return null;
  return (
    <WorkspaceAndTests
      task={task}
      candidateSessionId={candidateSessionId}
      actionGate={actionGate}
      codingWorkspace={codingWorkspace}
      onStartTests={onStartTests}
      onPollTests={onPollTests}
      onTaskWindowClosed={onTaskWindowClosed}
      onCodingWorkspaceSnapshot={onCodingWorkspaceSnapshot}
    />
  );
}
