'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '@/shared/notifications';
import { useAsyncLoader } from '@/shared/hooks';
import type { CandidateWorkspaceStatus } from '@/features/candidate/api';
import type {
  CodespaceAvailability,
  CodespaceFallbackReason,
} from '../utils/codespaceAvailability';
import { createWorkspaceStatusLoader } from '../utils/createWorkspaceStatusLoader';
import { handleWorkspaceStatusError } from './workspaceStatusError';
import { handleWorkspaceStatusSuccess } from './workspaceStatusSuccess';
import { useWorkspaceStatusControls } from './workspaceStatusControls';
import type { Params, WorkspaceStatusRefs, WorkspaceStatusSetters } from './workspaceStatus.types';

export function useWorkspaceStatus({
  taskId,
  candidateSessionId,
  enabled = true,
  enableCodespaceFallback = true,
  onTaskWindowClosed,
}: Params) {
  const { notify } = useNotifications();
  const [workspace, setWorkspace] = useState<CandidateWorkspaceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [codespaceAvailability, setCodespaceAvailability] = useState<CodespaceAvailability | null>(null);
  const [codespaceFallbackReason, setCodespaceFallbackReason] = useState<CodespaceFallbackReason | null>(null);
  const codespaceFallbackReasonRef = useRef<CodespaceFallbackReason | null>(null);
  const initAttemptedRef = useRef(false);
  const modeRef = useRef<'init' | 'refresh' | 'poll'>('init');
  const fallbackRetryModeRef = useRef<'init' | 'refresh'>('refresh');
  const loadTriggerRef = useRef<'initial' | 'manual_refresh' | 'poll' | 'fallback_retry_init' | 'fallback_retry_status'>('initial');
  const fallbackReasonBeforeRetryRef = useRef<CodespaceFallbackReason | null>(null);
  const notReadyPollCountRef = useRef(0);

  const refs = useMemo<WorkspaceStatusRefs>(
    () => ({ initAttemptedRef, modeRef, fallbackRetryModeRef, loadTriggerRef, fallbackReasonBeforeRetryRef, codespaceFallbackReasonRef, notReadyPollCountRef }),
    [],
  );
  const setters = useMemo<WorkspaceStatusSetters>(
    () => ({ setWorkspace, setLoading, setRefreshing, setError, setNotice, setCodespaceAvailability, setCodespaceFallbackReason }),
    [],
  );

  const loader = useCallback(() => {
    const run = createWorkspaceStatusLoader({ taskId, candidateSessionId, modeRef, initAttemptedRef, onTaskWindowClosed });
    return run();
  }, [candidateSessionId, onTaskWindowClosed, taskId]);

  const { load, abort } = useAsyncLoader(loader, {
    immediate: false,
    onSuccess: (result) =>
      handleWorkspaceStatusSuccess({ enableCodespaceFallback, taskId, notify, refs, setters }, result),
    onError: (err) => handleWorkspaceStatusError({ enableCodespaceFallback, refs, setters }, err),
  });

  useEffect(() => {
    codespaceFallbackReasonRef.current = codespaceFallbackReason;
  }, [codespaceFallbackReason]);

  const { refresh, retryCodespace } = useWorkspaceStatusControls({
    enabled,
    enableCodespaceFallback,
    loading,
    refreshing,
    codespaceAvailability,
    codespaceFallbackReason,
    abort,
    load,
    refs,
    setters,
  });

  return {
    workspace,
    loading: enabled ? loading : false,
    refreshing: enabled ? refreshing : false,
    error: enabled ? error : null,
    notice: enabled ? notice : null,
    codespaceAvailability: enabled ? codespaceAvailability : null,
    showCodespaceFallback: enabled && enableCodespaceFallback && Boolean(codespaceFallbackReason),
    codespaceFallbackReason: enabled && enableCodespaceFallback ? codespaceFallbackReason : null,
    refresh,
    retryCodespace,
  };
}
