import type { CandidateTask } from '../CandidateSessionProvider';
import type { DerivedWindowState, WindowActionGate } from '../lib/windowState';
import type { PollResult } from '@/features/candidate/tasks/hooks/useRunTestsTypes';
import type {
  SubmitPayload,
  SubmitResponse,
} from '@/features/candidate/tasks/types';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '@/features/candidate/tasks/utils/codingWorkspaceUtils';

export type RunningViewProps = {
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
  codingWorkspace?: CodingWorkspace | null;
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
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};
