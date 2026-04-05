import type {
  CandidateCurrentDayWindow,
  CandidateDayWindow,
} from '@/features/candidate/session/api';
import type { CandidateTask } from '../CandidateSessionProvider';
import type {
  SubmitPayload,
  SubmitResponse,
} from '@/features/candidate/tasks/types';
import type { PollResult } from '@/features/candidate/tasks/hooks/useRunTestsTypes';
import type { DerivedWindowState, WindowActionGate } from '../lib/windowState';
import type {
  CodingWorkspace,
  CodingWorkspaceSnapshot,
} from '@/features/candidate/tasks/utils/codingWorkspaceUtils';

export type ViewState =
  | 'loading'
  | 'auth'
  | 'accessDenied'
  | 'expired'
  | 'scheduling'
  | 'scheduleConfirm'
  | 'scheduleSubmitting'
  | 'locked'
  | 'starting'
  | 'error'
  | 'running';

export type CandidateSessionViewProps = {
  view: ViewState;
  authStatus: 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';
  authMessage: string | null;
  title: string;
  role: string;
  errorMessage: string | null;
  errorStatus: number | null;
  inviteErrorCopy: string;
  isComplete: boolean;
  started: boolean;
  currentDayIndex: number;
  completedCount: number;
  currentTask: CandidateTask | null;
  submitting: boolean;
  taskError: string | null;
  taskLoading: boolean;
  resourceLink: string | null;
  candidateSessionId: number | null;
  showWorkspacePanel: boolean;
  showRecordingPanel: boolean;
  showDocsPanel: boolean;
  loginHref: string;
  scheduleDate: string;
  scheduleTimezone: string;
  scheduleTimezoneDetected: string | null;
  scheduleTimezoneOptions: string[];
  scheduleDateError: string | null;
  scheduleTimezoneError: string | null;
  scheduleSubmitError: string | null;
  schedulePreviewWindows: CandidateDayWindow[];
  scheduleResponseWindows: CandidateDayWindow[];
  scheduleCurrentDayWindow: CandidateCurrentDayWindow | null;
  scheduleCountdownLabel: string;
  scheduleCountdownTargetAt: string | null;
  scheduleDisplayTimezone: string | null;
  scheduleDisplayStartAt: string | null;
  windowState: DerivedWindowState;
  actionGate: WindowActionGate;
  codingWorkspace?: CodingWorkspace | null;
  lastDraftSavedAt: number | null;
  lastSubmissionAt: string | null;
  lastSubmissionId: number | null;
  onStart: () => void;
  onDashboard: () => void;
  onReview: () => void;
  onRetryInit: () => void;
  onGoHome: () => void;
  onRetryTask: () => void;
  onScheduleDateChange: (value: string) => void;
  onScheduleTimezoneChange: (value: string) => void;
  onScheduleContinue: () => void;
  onScheduleBack: () => void;
  onScheduleConfirm: () => void;
  onScheduleRetry: () => void;
  onRefreshScheduleLock: () => void;
  onSubmit: (
    payload: SubmitPayload,
  ) => Promise<SubmitResponse | void> | SubmitResponse | void;
  onStartTests: () => Promise<{ runId: string }>;
  onPollTests: (runId: string) => Promise<PollResult>;
  onTaskWindowClosed: (err: unknown) => void;
  onCodingWorkspaceSnapshot?: (snapshot: CodingWorkspaceSnapshot) => void;
};
