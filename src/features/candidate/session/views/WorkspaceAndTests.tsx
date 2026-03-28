import { RunTestsPanel } from '@/features/candidate/tasks/components/RunTestsPanel';
import { WorkspacePanel } from '@/features/candidate/tasks/components/WorkspacePanel';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { PollResult } from '@/features/candidate/tasks/hooks/useRunTestsTypes';
import type { WindowActionGate } from '../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '@/features/candidate/tasks/utils/codingWorkspaceUtils';

export type WorkspaceAndTestsProps = {
  task: CandidateTask;
  candidateSessionId: number;
  actionGate: WindowActionGate;
  codingWorkspace?: CodingWorkspace | null;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onTaskWindowClosed: (err: unknown) => void;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};

export function WorkspaceAndTests({
  task,
  candidateSessionId,
  actionGate,
  codingWorkspace,
  onStartTests,
  onPollTests,
  onTaskWindowClosed,
  onCodingWorkspaceSnapshot,
}: WorkspaceAndTestsProps) {
  const closedByCutoff = Boolean(task.cutoffCommitSha);
  const workspaceReadOnly = actionGate.isReadOnly || closedByCutoff;
  const cutoffDisabledReason = closedByCutoff
    ? 'Day closed. Work after cutoff will not be considered.'
    : null;
  const disabledReason = actionGate.disabledReason ?? cutoffDisabledReason;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <WorkspacePanel
        taskId={task.id}
        candidateSessionId={candidateSessionId}
        dayIndex={task.dayIndex}
        readOnly={workspaceReadOnly}
        readOnlyReason={disabledReason}
        codingWorkspace={codingWorkspace}
        cutoffCommitSha={task.cutoffCommitSha ?? null}
        cutoffAt={task.cutoffAt ?? null}
        isClosed={closedByCutoff}
        onTaskWindowClosed={onTaskWindowClosed}
        onCodingWorkspaceSnapshot={onCodingWorkspaceSnapshot}
      />
      <RunTestsPanel
        onStart={onStartTests}
        onPoll={onPollTests}
        storageKey={`tenon:taskRun:${task.id}`}
        disabled={workspaceReadOnly}
        disabledReason={disabledReason}
      />
    </div>
  );
}
