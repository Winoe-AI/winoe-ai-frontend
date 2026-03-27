import { useReducer } from 'react';
import type { WindowActionGate } from '../../lib/windowState';
import type { Task } from '../types';
import { DEFAULT_NOTICE_VERSION } from './panelConstants';
import {
  handoffUploadReducer,
  initialHandoffUploadState,
} from './handoffUploadMachine';
import { deriveHandoffViewState } from './deriveHandoffViewState';
import { useHandoffStatusSync } from './useHandoffStatusSync';
import { useHandoffUploadActions } from './useHandoffUploadActions';

type UseHandoffUploadControllerArgs = {
  candidateSessionId: number | null;
  task: Task;
  actionGate: WindowActionGate;
  onTaskWindowClosed?: (err: unknown) => void;
};

export function useHandoffUploadController({
  candidateSessionId,
  task,
  actionGate,
  onTaskWindowClosed,
}: UseHandoffUploadControllerArgs) {
  const [state, dispatch] = useReducer(
    handoffUploadReducer,
    initialHandoffUploadState,
  );

  const windowClosedFromState = state.phase === 'window_closed';
  const windowClosed = actionGate.isReadOnly || windowClosedFromState;
  const windowClosedMessage =
    state.windowClosedMessage ??
    actionGate.disabledReason ??
    'This day is currently closed outside the scheduled window.';
  const aiNoticeVersion = state.aiNoticeVersion ?? DEFAULT_NOTICE_VERSION;

  const { refreshStatus } = useHandoffStatusSync({
    candidateSessionId,
    taskId: task.id,
    state,
    actionGate,
    onTaskWindowClosed,
    dispatch,
  });

  const actions = useHandoffUploadActions({
    candidateSessionId,
    taskId: task.id,
    state,
    windowClosed,
    windowClosedMessage,
    aiNoticeVersion,
    onTaskWindowClosed,
    refreshStatus,
    dispatch,
  });

  const derived = deriveHandoffViewState({
    state,
    candidateSessionId,
    pendingFinalize: actions.pendingFinalize,
    consentChecked: actions.consentChecked,
    completingUpload: actions.completingUpload,
    deletingUpload: actions.deletingUpload,
    windowClosed,
    windowClosedMessage,
  });

  return {
    state,
    ...actions,
    windowClosed,
    windowClosedMessage,
    ...derived,
    refreshStatus,
  };
}
