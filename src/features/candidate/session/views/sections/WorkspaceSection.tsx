import { WorkspaceAndTests } from '../WorkspaceAndTests';
import type { CandidateTask } from '../../CandidateSessionProvider';
import type { PollResult } from '../../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../../lib/windowState';

type Props = {
  task: CandidateTask | null;
  candidateSessionId: number | null;
  showWorkspacePanel: boolean;
  actionGate: WindowActionGate;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onTaskWindowClosed: (err: unknown) => void;
};

export function WorkspaceSection({
  task,
  candidateSessionId,
  showWorkspacePanel,
  actionGate,
  onStartTests,
  onPollTests,
  onTaskWindowClosed,
}: Props) {
  if (!showWorkspacePanel || candidateSessionId === null || !task) return null;
  return (
    <WorkspaceAndTests
      task={task}
      candidateSessionId={candidateSessionId}
      actionGate={actionGate}
      onStartTests={onStartTests}
      onPollTests={onPollTests}
      onTaskWindowClosed={onTaskWindowClosed}
    />
  );
}
