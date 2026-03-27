import type { Dispatch, SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import { useSubmitInviteCallback } from './useSubmitInviteCallback';
import { useTerminateCallbacks } from './useTerminateCallbacks';

type NotifyFn = (payload: ToastInput) => void;

type UseSimulationDetailCallbacksArgs = {
  simulationId: string;
  simulationStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  selectedScenarioVersionText: string;
  hasSelectedScenarioVersion: boolean;
  terminatePending: boolean;
  terminateModalOpen: boolean;
  isTerminated: boolean;
  inviteDisabledReason: string | null;
  closeInviteModal: () => void;
  submitInvite: (candidateName: string, inviteEmail: string) => Promise<void>;
  notify: NotifyFn;
  setActionError: Dispatch<SetStateAction<string | null>>;
  setTerminatePending: Dispatch<SetStateAction<boolean>>;
  setStatusOverride: Dispatch<SetStateAction<string | null>>;
  setCleanupJobIds: Dispatch<SetStateAction<string[]>>;
  setTerminateModalOpen: Dispatch<SetStateAction<boolean>>;
  setTerminateBlockedStatus: Dispatch<SetStateAction<403 | 404 | null>>;
};

export function useSimulationDetailCallbacks({
  simulationId,
  simulationStatus,
  selectedScenarioVersionIndex,
  selectedScenarioVersionText,
  hasSelectedScenarioVersion,
  terminatePending,
  terminateModalOpen,
  isTerminated,
  inviteDisabledReason,
  closeInviteModal,
  submitInvite,
  notify,
  setActionError,
  setTerminatePending,
  setStatusOverride,
  setCleanupJobIds,
  setTerminateModalOpen,
  setTerminateBlockedStatus,
}: UseSimulationDetailCallbacksArgs) {
  const approveButtonLabel = hasSelectedScenarioVersion
    ? `Approve ${selectedScenarioVersionText} / Start inviting`
    : 'Approve / Start inviting';

  const onSubmitInvite = useSubmitInviteCallback({
    simulationId,
    isTerminated,
    inviteDisabledReason,
    closeInviteModal,
    submitInvite,
    notify,
    setActionError,
  });
  const { onSetTerminateModalOpen, onTerminate } = useTerminateCallbacks({
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
  });

  return {
    approveButtonLabel,
    onSubmitInvite,
    onSetTerminateModalOpen,
    onTerminate,
  };
}
