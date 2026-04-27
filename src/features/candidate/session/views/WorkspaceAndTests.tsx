'use client';

import { useOptionalCandidateSession } from '../state/context';
import { RunTestsPanel } from '@/features/candidate/tasks/components/RunTestsPanel';
import { WorkspacePanel } from '@/features/candidate/tasks/components/WorkspacePanel';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { PollResult } from '@/features/candidate/tasks/hooks/useRunTestsTypes';
import type { WindowActionGate } from '../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '@/features/candidate/tasks/utils/codingWorkspaceUtils';
import { isPastTaskCutoff } from '@/features/candidate/tasks/utils/taskCutoffUtils';

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
  const session = useOptionalCandidateSession();
  const githubUsername = session?.state.bootstrap?.githubUsername ?? null;
  const closedByCutoff = isPastTaskCutoff(task.cutoffAt);
  const workspaceReadOnly = actionGate.isReadOnly || closedByCutoff;
  const cutoffDisabledReason = closedByCutoff
    ? 'Day closed. The Codespace is read-only after cutoff.'
    : null;
  const disabledReason = actionGate.disabledReason ?? cutoffDisabledReason;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <WorkspacePanel
        taskId={task.id}
        candidateSessionId={candidateSessionId}
        dayIndex={task.dayIndex}
        githubUsername={githubUsername}
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
        storageKey={`winoe:taskRun:${task.id}`}
        disabled={workspaceReadOnly}
        disabledReason={disabledReason}
      />
    </div>
  );
}
