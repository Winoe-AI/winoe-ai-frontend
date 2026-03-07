import { RunTestsPanel } from '../task/components/RunTestsPanel';
import { WorkspacePanel } from '../task/components/WorkspacePanel';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { PollResult } from '../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../lib/windowState';

type Props = {
  task: CandidateTask;
  candidateSessionId: number;
  actionGate: WindowActionGate;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onTaskWindowClosed: (err: unknown) => void;
};

export function WorkspaceAndTests({
  task,
  candidateSessionId,
  actionGate,
  onStartTests,
  onPollTests,
  onTaskWindowClosed,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <WorkspacePanel
        taskId={task.id}
        candidateSessionId={candidateSessionId}
        dayIndex={task.dayIndex}
        readOnly={actionGate.isReadOnly}
        readOnlyReason={actionGate.disabledReason}
        onTaskWindowClosed={onTaskWindowClosed}
      />
      <RunTestsPanel
        onStart={onStartTests}
        onPoll={onPollTests}
        storageKey={`tenon:taskRun:${task.id}`}
        disabled={actionGate.isReadOnly}
        disabledReason={actionGate.disabledReason}
      />
    </div>
  );
}
