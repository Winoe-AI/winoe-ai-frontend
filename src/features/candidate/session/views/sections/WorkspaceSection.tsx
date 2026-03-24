import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type { CandidateTask } from '../../CandidateSessionProvider';
import type { PollResult } from '../../task/hooks/runTestsTypes';
import type { WindowActionGate } from '../../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '../../task/utils/codingWorkspace';
import type { WorkspaceAndTestsProps } from '../WorkspaceAndTests';

const LazyWorkspaceAndTests = dynamic<WorkspaceAndTestsProps>(
  () => import('../WorkspaceAndTests').then((mod) => mod.WorkspaceAndTests),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading workspace tools...
      </div>
    ),
  },
);

let WorkspaceAndTestsComponent: ComponentType<WorkspaceAndTestsProps> =
  LazyWorkspaceAndTests;

if (process.env.NODE_ENV === 'test') {
  WorkspaceAndTestsComponent =
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (require('../WorkspaceAndTests') as typeof import('../WorkspaceAndTests'))
      .WorkspaceAndTests;
}

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
    <WorkspaceAndTestsComponent
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
