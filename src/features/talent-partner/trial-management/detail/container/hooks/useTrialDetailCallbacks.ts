import { useState, type Dispatch, type SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import { logTrialDetailEvent } from '../../utils/eventsUtils';
import { activateTrialAction } from '../actions/activateTrialAction';
import { useSubmitInviteCallback } from './useSubmitInviteCallback';
import { useTerminateCallbacks } from './useTerminateCallbacks';

type NotifyFn = (payload: ToastInput) => void;

type UseTrialDetailCallbacksArgs = {
  trialId: string;
  trialStatus: string | null;
  selectedScenarioVersionIndex: number | null;
  selectedScenarioVersionText: string;
  hasSelectedScenarioVersion: boolean;
  canActivate: boolean;
  refreshPlan: () => Promise<void>;
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

export function useTrialDetailCallbacks({
  trialId,
  trialStatus,
  selectedScenarioVersionIndex,
  selectedScenarioVersionText,
  hasSelectedScenarioVersion,
  canActivate,
  refreshPlan,
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
}: UseTrialDetailCallbacksArgs) {
  const approveButtonLabel = hasSelectedScenarioVersion
    ? `Approve ${selectedScenarioVersionText}`
    : 'Approve';
  const activateButtonLabel = 'Activate trial';
  const [activateLoading, setActivateLoading] = useState(false);

  const onSubmitInvite = useSubmitInviteCallback({
    trialId,
    isTerminated,
    inviteDisabledReason,
    closeInviteModal,
    submitInvite,
    notify,
    setActionError,
  });
  const onActivate = async () => {
    if (!canActivate) return;
    await activateTrialAction({
      activateLoading,
      trialId,
      trialStatus,
      selectedScenarioVersionIndex,
      setActionError,
      setActivateLoading,
      setStatusOverride,
      refreshPlan,
      notify,
      logEvent: logTrialDetailEvent,
    });
  };
  const { onSetTerminateModalOpen, onTerminate } = useTerminateCallbacks({
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
  });

  return {
    approveButtonLabel,
    activateButtonLabel,
    activateLoading,
    canActivate,
    onActivate,
    onSubmitInvite,
    onSetTerminateModalOpen,
    onTerminate,
  };
}
