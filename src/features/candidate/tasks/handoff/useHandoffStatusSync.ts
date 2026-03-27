import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { WindowActionGate } from '@/features/candidate/session/lib/windowState';
import {
  extractTaskWindowClosedOverride,
  formatComeBackMessage,
} from '@/features/candidate/session/lib/windowState';
import { getHandoffStatus } from './handoffApi';
import { POLL_INTERVAL_MS } from './panelConstants';
import { toUploadErrorMessage } from './panelUtils';
import {
  shouldPollHandoffStatus,
  type HandoffUploadAction,
  type HandoffUploadState,
} from './handoffUploadMachine';

type Params = {
  candidateSessionId: number | null;
  taskId: number;
  state: HandoffUploadState;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
  dispatch: Dispatch<HandoffUploadAction>;
};

export function useHandoffStatusSync({
  candidateSessionId,
  taskId,
  state,
  actionGate,
  onTaskWindowClosed,
  dispatch,
}: Params) {
  const statusRefreshRequestIdRef = useRef(0);
  const latestStatusRefreshAppliedRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    if (candidateSessionId === null) return;
    const requestId = statusRefreshRequestIdRef.current + 1;
    statusRefreshRequestIdRef.current = requestId;

    try {
      const status = await getHandoffStatus({ taskId, candidateSessionId });
      if (requestId < latestStatusRefreshAppliedRef.current) return;
      latestStatusRefreshAppliedRef.current = requestId;
      dispatch({ type: 'STATUS_SYNCED', payload: status });
    } catch (err) {
      if (requestId < latestStatusRefreshAppliedRef.current) return;
      latestStatusRefreshAppliedRef.current = requestId;
      const windowClosed = extractTaskWindowClosedOverride(err);
      if (windowClosed) {
        onTaskWindowClosed?.(err);
        dispatch({
          type: 'WINDOW_CLOSED',
          message: formatComeBackMessage(windowClosed),
        });
        return;
      }
      dispatch({
        type: 'STATUS_FAILED',
        message: toUploadErrorMessage(
          err,
          'Unable to refresh upload status right now.',
        ),
      });
    }
  }, [candidateSessionId, dispatch, onTaskWindowClosed, taskId]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!shouldPollHandoffStatus(state)) return;
    const timer = window.setInterval(() => {
      void refreshStatus();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshStatus, state]);

  useEffect(() => {
    if (actionGate.isReadOnly) return;
    dispatch({ type: 'WINDOW_REOPENED' });
  }, [actionGate.isReadOnly, dispatch]);

  return { refreshStatus };
}
