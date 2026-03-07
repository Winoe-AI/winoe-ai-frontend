'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/shared/notifications';
import { useAsyncLoader } from '@/shared/hooks';
import type { CandidateWorkspaceStatus } from '@/features/candidate/api';
import { createWorkspaceStatusLoader } from '../utils/createWorkspaceStatusLoader';

type Params = {
  taskId: number;
  candidateSessionId: number;
  enabled?: boolean;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function useWorkspaceStatus({
  taskId,
  candidateSessionId,
  enabled = true,
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
  const initAttemptedRef = useRef(false);
  const modeRef = useRef<'init' | 'refresh'>('init');

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
      if (result.workspace) {
        setWorkspace(result.workspace);
        initAttemptedRef.current = true;
      }
      setNotice(result.notice);
      setError(result.error);
      if (result.notify) {
        const id =
          result.notify.tone === 'success'
            ? `workspace-${taskId}-refresh`
            : `workspace-${taskId}-error`;
        notify({ id, ...result.notify });
      }
      if (modeRef.current === 'init') setLoading(false);
      else setRefreshing(false);
    },
    onError: (err) => {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to load your workspace right now.';
      setError(message);
      setLoading(false);
      setRefreshing(false);
      return message;
    },
  });

  useEffect(() => {
    if (!enabled) {
      abort();
      return;
    }
    modeRef.current = 'init';
    const id = window.setTimeout(() => {
      void load(true);
    }, 0);
    return () => {
      window.clearTimeout(id);
      abort();
    };
  }, [abort, enabled, load]);

  const refresh = () => {
    if (!enabled) return;
    if (loading || refreshing) return;
    modeRef.current = 'refresh';
    setRefreshing(true);
    void load(true);
  };

  return {
    workspace,
    loading: enabled ? loading : false,
    refreshing: enabled ? refreshing : false,
    error: enabled ? error : null,
    notice: enabled ? notice : null,
    refresh,
  };
}
