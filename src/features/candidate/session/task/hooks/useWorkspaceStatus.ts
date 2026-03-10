'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/shared/notifications';
import { useAsyncLoader } from '@/shared/hooks';
import type { CandidateWorkspaceStatus } from '@/features/candidate/api';
import { createWorkspaceStatusLoader } from '../utils/createWorkspaceStatusLoader';
import {
  CODESPACE_NOT_READY_MAX_POLLS,
  CODESPACE_NOT_READY_POLL_INTERVAL_MS,
  classifyCodespaceAvailability,
  type CodespaceAvailability,
  type CodespaceFallbackReason,
} from '../utils/codespaceAvailability';

type Params = {
  taskId: number;
  candidateSessionId: number;
  enabled?: boolean;
  enableCodespaceFallback?: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
};

type WorkspaceLoadMode = 'init' | 'refresh' | 'poll';
type FallbackRetryMode = 'init' | 'refresh';
type WorkspaceLoadTrigger =
  | 'initial'
  | 'manual_refresh'
  | 'poll'
  | 'fallback_retry_init'
  | 'fallback_retry_status';

function isFallbackRetryTrigger(trigger: WorkspaceLoadTrigger): boolean {
  return (
    trigger === 'fallback_retry_init' || trigger === 'fallback_retry_status'
  );
}

export function useWorkspaceStatus({
  taskId,
  candidateSessionId,
  enabled = true,
  enableCodespaceFallback = true,
  onTaskWindowClosed,
}: Params) {
  const { notify } = useNotifications();
  const [workspace, setWorkspace] = useState<CandidateWorkspaceStatus | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [codespaceAvailability, setCodespaceAvailability] =
    useState<CodespaceAvailability | null>(null);
  const [codespaceFallbackReason, setCodespaceFallbackReason] =
    useState<CodespaceFallbackReason | null>(null);
  const codespaceFallbackReasonRef = useRef<CodespaceFallbackReason | null>(
    null,
  );
  const initAttemptedRef = useRef(false);
  const modeRef = useRef<WorkspaceLoadMode>('init');
  const fallbackRetryModeRef = useRef<FallbackRetryMode>('refresh');
  const loadTriggerRef = useRef<WorkspaceLoadTrigger>('initial');
  const fallbackReasonBeforeRetryRef = useRef<CodespaceFallbackReason | null>(
    null,
  );
  const notReadyPollCountRef = useRef(0);

  const loader = useCallback(() => {
    const run = createWorkspaceStatusLoader({
      taskId,
      candidateSessionId,
      modeRef,
      initAttemptedRef,
      onTaskWindowClosed,
    });
    return run();
  }, [candidateSessionId, onTaskWindowClosed, taskId]);

  const { load, abort } = useAsyncLoader(loader, {
    immediate: false,
    onSuccess: (result) => {
      const mode = modeRef.current;
      const trigger = loadTriggerRef.current;
      const fallbackReasonBeforeRetry = fallbackReasonBeforeRetryRef.current;
      fallbackReasonBeforeRetryRef.current = null;
      if (result.workspace) {
        setWorkspace(result.workspace);
        initAttemptedRef.current = true;
      }
      setNotice(result.notice);
      setError(result.error);
      const availability = classifyCodespaceAvailability(result);
      setCodespaceAvailability(availability);

      if (availability === 'ready') {
        notReadyPollCountRef.current = 0;
        setCodespaceFallbackReason(null);
        fallbackRetryModeRef.current = 'refresh';
      } else if (availability === 'not_ready') {
        const nextPollCount = notReadyPollCountRef.current + 1;
        notReadyPollCountRef.current = nextPollCount;
        if (
          enableCodespaceFallback &&
          nextPollCount >= CODESPACE_NOT_READY_MAX_POLLS
        ) {
          setCodespaceFallbackReason('not_ready_timeout');
          fallbackRetryModeRef.current = 'refresh';
        }
      } else if (availability === 'unavailable') {
        if (enableCodespaceFallback) {
          setCodespaceFallbackReason('unavailable');
          fallbackRetryModeRef.current = mode === 'init' ? 'init' : 'refresh';
        }
      } else if (enableCodespaceFallback && mode === 'init') {
        setCodespaceFallbackReason('init_error');
        fallbackRetryModeRef.current = 'init';
      } else if (
        enableCodespaceFallback &&
        isFallbackRetryTrigger(trigger) &&
        fallbackReasonBeforeRetry
      ) {
        setCodespaceFallbackReason(fallbackReasonBeforeRetry);
        fallbackRetryModeRef.current =
          trigger === 'fallback_retry_init' ? 'init' : 'refresh';
      }

      if (result.notify) {
        const id =
          result.notify.tone === 'success'
            ? `workspace-${taskId}-refresh`
            : `workspace-${taskId}-error`;
        notify({ id, ...result.notify });
      }
      if (mode === 'init') setLoading(false);
      else setRefreshing(false);
    },
    onError: (err) => {
      const trigger = loadTriggerRef.current;
      const fallbackReasonBeforeRetry = fallbackReasonBeforeRetryRef.current;
      fallbackReasonBeforeRetryRef.current = null;
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load your workspace right now.';
      setError(message);
      setLoading(false);
      setRefreshing(false);
      setCodespaceAvailability('error');
      if (
        enableCodespaceFallback &&
        isFallbackRetryTrigger(trigger) &&
        fallbackReasonBeforeRetry
      ) {
        setCodespaceFallbackReason(fallbackReasonBeforeRetry);
        fallbackRetryModeRef.current =
          trigger === 'fallback_retry_init' ? 'init' : 'refresh';
      } else if (enableCodespaceFallback && modeRef.current === 'init') {
        setCodespaceFallbackReason('init_error');
        fallbackRetryModeRef.current = 'init';
      }
      return message;
    },
  });

  useEffect(() => {
    codespaceFallbackReasonRef.current = codespaceFallbackReason;
  }, [codespaceFallbackReason]);

  const dispatchLoad = useCallback(
    ({
      mode,
      trigger,
      resetPollCount = false,
      clearFallbackReason = false,
      preserveFallbackReasonOnFailure = false,
    }: {
      mode: WorkspaceLoadMode;
      trigger: WorkspaceLoadTrigger;
      resetPollCount?: boolean;
      clearFallbackReason?: boolean;
      preserveFallbackReasonOnFailure?: boolean;
    }) => {
      if (!enabled) return;
      if (resetPollCount) {
        notReadyPollCountRef.current = 0;
      }
      modeRef.current = mode;
      loadTriggerRef.current = trigger;
      if (clearFallbackReason) {
        fallbackReasonBeforeRetryRef.current = preserveFallbackReasonOnFailure
          ? codespaceFallbackReasonRef.current
          : null;
        setCodespaceFallbackReason(null);
      } else {
        fallbackReasonBeforeRetryRef.current = null;
      }
      if (mode === 'init') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      void load(true);
    },
    [enabled, load],
  );

  useEffect(() => {
    if (!enabled) {
      abort();
      notReadyPollCountRef.current = 0;
      fallbackRetryModeRef.current = 'refresh';
      return;
    }
    notReadyPollCountRef.current = 0;
    const id = window.setTimeout(() => {
      dispatchLoad({
        mode: 'init',
        trigger: 'initial',
        clearFallbackReason: true,
      });
    }, 0);
    return () => {
      window.clearTimeout(id);
      abort();
    };
  }, [abort, dispatchLoad, enabled]);

  useEffect(() => {
    if (!enabled || !enableCodespaceFallback) return;
    if (loading || refreshing) return;
    if (codespaceFallbackReason) return;
    if (codespaceAvailability !== 'not_ready') return;
    if (notReadyPollCountRef.current >= CODESPACE_NOT_READY_MAX_POLLS) return;

    const id = window.setTimeout(() => {
      dispatchLoad({
        mode: 'poll',
        trigger: 'poll',
      });
    }, CODESPACE_NOT_READY_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(id);
    };
  }, [
    codespaceAvailability,
    codespaceFallbackReason,
    enabled,
    enableCodespaceFallback,
    dispatchLoad,
    loading,
    refreshing,
  ]);

  const refresh = () => {
    if (!enabled) return;
    if (loading || refreshing) return;
    dispatchLoad({
      mode: 'refresh',
      trigger: 'manual_refresh',
      resetPollCount: true,
      clearFallbackReason: true,
    });
  };

  const retryCodespace = () => {
    if (!enabled) return;
    if (loading || refreshing) return;
    const shouldRetryInit = fallbackRetryModeRef.current === 'init';
    dispatchLoad({
      mode: shouldRetryInit ? 'init' : 'refresh',
      trigger: shouldRetryInit
        ? 'fallback_retry_init'
        : 'fallback_retry_status',
      resetPollCount: true,
      clearFallbackReason: true,
      preserveFallbackReasonOnFailure: true,
    });
  };

  return {
    workspace,
    loading: enabled ? loading : false,
    refreshing: enabled ? refreshing : false,
    error: enabled ? error : null,
    notice: enabled ? notice : null,
    codespaceAvailability: enabled ? codespaceAvailability : null,
    showCodespaceFallback:
      enabled && enableCodespaceFallback && Boolean(codespaceFallbackReason),
    codespaceFallbackReason:
      enabled && enableCodespaceFallback ? codespaceFallbackReason : null,
    refresh,
    retryCodespace,
  };
}
