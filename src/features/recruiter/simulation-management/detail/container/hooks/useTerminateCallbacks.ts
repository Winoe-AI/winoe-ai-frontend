import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import { logSimulationDetailEvent } from '../../utils/eventsUtils';
import { terminateSimulationAction } from '../actions/terminateSimulationAction';

type NotifyFn = (payload: ToastInput) => void;

type UseTerminateCallbacksArgs = {
  simulationId: string;
  simulationStatus: string | null;
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
  simulationId,
  simulationStatus,
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
        logSimulationDetailEvent('terminate_clicked', {
          simulationId,
          status: simulationStatus,
          scenarioVersion: selectedScenarioVersionIndex,
        });
      }
      setTerminateModalOpen(open);
    },
    [
      selectedScenarioVersionIndex,
      setTerminateModalOpen,
      simulationId,
      simulationStatus,
      terminateModalOpen,
    ],
  );

  const onTerminate = useCallback(async () => {
    await terminateSimulationAction({
      terminatePending,
      simulationId,
      simulationStatus,
      selectedScenarioVersionIndex,
      setActionError,
      setTerminatePending,
      setStatusOverride,
      setCleanupJobIds,
      setTerminateModalOpen,
      setTerminateBlockedStatus,
      closeInviteModal,
      notify,
      logEvent: logSimulationDetailEvent,
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
    simulationId,
    simulationStatus,
    terminatePending,
  ]);

  return { onSetTerminateModalOpen, onTerminate };
}
