import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import { logTrialDetailEvent } from '../../utils/eventsUtils';
import { terminateTrialAction } from '../actions/terminateTrialAction';

type NotifyFn = (payload: ToastInput) => void;

type UseTerminateCallbacksArgs = {
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  terminatePending: boolean;
  terminateModalOpen: boolean;
  closeInviteModal: () => void;
  notify: NotifyFn;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setTerminatePending: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  setCleanupJobIds: Dispatch<SetStateAction<string[]>>;
  setTerminateModalOpen: Dispatch<SetStateAction<boolean>>;
  setTerminateBlockedStatus: Dispatch<SetStateAction<403 | 404 | null>>;
};

export function useTerminateCallbacks({
  trialId,
  trialStatus,
  selectedScenarioVersionIndex,
  terminatePending,
  terminateModalOpen,
  closeInviteModal,
  notify,
  setActionError,
  setTerminatePending,
  setStatusOverride,
  setCleanupJobIds,
  setTerminateModalOpen,
  setTerminateBlockedStatus,
}: UseTerminateCallbacksArgs) {
  const onSetTerminateModalOpen = useCallback(
    (open: boolean) => {
      if (open && !terminateModalOpen) {
        logTrialDetailEvent('terminate_clicked', {
          trialId,
          status: trialStatus,
          scenarioVersion: selectedScenarioVersionIndex,
        });
      }
      setTerminateModalOpen(open);
    },
    [
      selectedScenarioVersionIndex,
      setTerminateModalOpen,
      trialId,
      trialStatus,
      terminateModalOpen,
    ],
  );

  const onTerminate = useCallback(async () => {
    await terminateTrialAction({
      terminatePending,
      trialId,
      trialStatus,
      selectedScenarioVersionIndex,
      setActionError,
      setTerminatePending,
      setStatusOverride,
      setCleanupJobIds,
      setTerminateModalOpen,
      setTerminateBlockedStatus,
      closeInviteModal,
      notify,
      logEvent: logTrialDetailEvent,
    });
  }, [
    closeInviteModal,
    notify,
    selectedScenarioVersionIndex,
    setActionError,
    setCleanupJobIds,
    setStatusOverride,
    setTerminateBlockedStatus,
    setTerminateModalOpen,
    setTerminatePending,
    trialId,
    trialStatus,
    terminatePending,
  ]);

  return { onSetTerminateModalOpen, onTerminate };
}
