import type { useCandidateDerivedInfo } from '../useCandidateDerivedInfo';
import type { useCandidateSessionActions } from '../useCandidateSessionActions';
import type { useWindowState } from '../useWindowState';
import type { ViewState } from '../../views/types';
import type { useCandidateSessionSchedule } from './useCandidateSessionSchedule';
import type { useCodingWorkspaceSync } from './useCodingWorkspaceSync';

export type BuildCandidateSessionControllerResultArgs = {
  finalView: ViewState;
  state: {
    authStatus: 'idle' | 'loading' | 'ready' | 'unauthenticated' | 'error';
    started: boolean;
    taskState: { error: string | null; loading: boolean; isComplete: boolean };
  };
  authMessage: string | null;
  errorMessage: string | null;
  errorStatus: number | null;
  loginHref: string;
  derived: ReturnType<typeof useCandidateDerivedInfo>;
  actions: ReturnType<typeof useCandidateSessionActions>;
  candidateSessionId: number | null;
  schedule: ReturnType<typeof useCandidateSessionSchedule>;
  detectedTimezone: string | null;
  timezoneOptions: string[];
  windowState: ReturnType<typeof useWindowState>;
  codingWorkspace: ReturnType<typeof useCodingWorkspaceSync>['codingWorkspace'];
  lastDraftSavedAt: number | null;
  lastSubmissionAt: string | null;
  lastSubmissionId: number | null;
  onStart: () => void;
  onDashboard: () => void;
  onReview: () => void;
  onGoHome: () => void;
  token: string;
  onTaskWindowClosed: (err: unknown) => void;
  onCodingWorkspaceSnapshot: ReturnType<
    typeof useCodingWorkspaceSync
  >['onCodingWorkspaceSnapshot'];
};
