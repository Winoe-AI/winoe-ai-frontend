import { RunningIntroSection } from './components/RunningIntroSection';
import { RunningPanelsSection } from './components/RunningPanelsSection';
import { SessionWindowBanner } from '../components/SessionWindowBanner';
import type { CandidateTask } from '../CandidateSessionProvider';
import type { SubmitPayload, SubmitResponse } from '../task/types';
import type { PollResult } from '../task/hooks/runTestsTypes';
import type { DerivedWindowState, WindowActionGate } from '../lib/windowState';

type Props = {
  title: string;
  role: string;
  completedCount: number;
  currentDayIndex: number;
  currentTask: CandidateTask | null;
  candidateSessionId: number | null;
  taskError: string | null;
  taskLoading: boolean;
  resourceLink: string | null;
  submitting: boolean;
  showWorkspacePanel: boolean;
  showRecordingPanel: boolean;
  showDocsPanel: boolean;
  windowState: DerivedWindowState;
  actionGate: WindowActionGate;
  lastDraftSavedAt: number | null;
  lastSubmissionAt: string | null;
  lastSubmissionId: number | null;
  onRetryTask: () => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onDashboard: () => void;
  onTaskWindowClosed: (err: unknown) => void;
};

export function RunningView({
  title,
  role,
  completedCount,
  currentDayIndex,
  currentTask,
  candidateSessionId,
  taskError,
  taskLoading,
  resourceLink,
  submitting,
  showWorkspacePanel,
  showRecordingPanel,
  showDocsPanel,
  windowState,
  actionGate,
  lastDraftSavedAt,
  lastSubmissionAt,
  lastSubmissionId,
  onRetryTask,
  onSubmit,
  onStartTests,
  onPollTests,
  onDashboard,
  onTaskWindowClosed,
}: Props) {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <SessionWindowBanner
        windowState={windowState}
        lastDraftSavedAt={lastDraftSavedAt}
        lastSubmissionAt={lastSubmissionAt}
        lastSubmissionId={lastSubmissionId}
      />
      <RunningIntroSection
        title={title}
        role={role}
        taskLoading={taskLoading}
        completedCount={completedCount}
        currentDayIndex={currentDayIndex}
        currentTaskTitle={currentTask?.title ?? null}
        taskError={taskError}
        onRetryTask={onRetryTask}
      />

      <RunningPanelsSection
        currentTask={currentTask}
        candidateSessionId={candidateSessionId}
        resourceLink={resourceLink}
        submitting={submitting}
        showWorkspacePanel={showWorkspacePanel}
        showRecordingPanel={showRecordingPanel}
        showDocsPanel={showDocsPanel}
        actionGate={actionGate}
        taskError={taskError}
        onSubmit={onSubmit}
        onRetryTask={onRetryTask}
        onStartTests={onStartTests}
        onPollTests={onPollTests}
        onDashboard={onDashboard}
        onTaskWindowClosed={onTaskWindowClosed}
      />
    </div>
  );
}
