import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { CandidateWorkspaceStatus } from '@/features/candidate/session/api';
import type {
  CodespaceAvailability,
  CodespaceFallbackReason,
} from '../utils/codespaceAvailabilityUtils';

export type Params = {
  taskId: number;
  candidateSessionId: number;
  enabled?: boolean;
  enableCodespaceFallback?: boolean;
  githubUsername?: string | null;
  onTaskWindowClosed?: (err: unknown) => void;
};

export type WorkspaceLoadMode = 'init' | 'refresh' | 'poll';
export type FallbackRetryMode = 'init' | 'refresh';
export type WorkspaceLoadTrigger =
  | 'initial'
  | 'manual_refresh'
  | 'poll'
  | 'fallback_retry_init'
  | 'fallback_retry_status';

export type DispatchLoadArgs = {
  mode: WorkspaceLoadMode;
  trigger: WorkspaceLoadTrigger;
  resetPollCount?: boolean;
  clearFallbackReason?: boolean;
  preserveFallbackReasonOnFailure?: boolean;
};

export type WorkspaceStatusRefs = {
  initAttemptedRef: MutableRefObject<boolean>;
  modeRef: MutableRefObject<WorkspaceLoadMode>;
  fallbackRetryModeRef: MutableRefObject<FallbackRetryMode>;
  loadTriggerRef: MutableRefObject<WorkspaceLoadTrigger>;
  fallbackReasonBeforeRetryRef: MutableRefObject<CodespaceFallbackReason | null>;
  codespaceFallbackReasonRef: MutableRefObject<CodespaceFallbackReason | null>;
  notReadyPollCountRef: MutableRefObject<number>;
};

export type WorkspaceStatusSetters = {
  setWorkspace: Dispatch<SetStateAction<CandidateWorkspaceStatus | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setRefreshing: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setCodespaceAvailability: Dispatch<
    SetStateAction<CodespaceAvailability | null>
  >;
  setCodespaceFallbackReason: Dispatch<
    SetStateAction<CodespaceFallbackReason | null>
  >;
};

export function isFallbackRetryTrigger(trigger: WorkspaceLoadTrigger): boolean {
  return (
    trigger === 'fallback_retry_init' || trigger === 'fallback_retry_status'
  );
}
