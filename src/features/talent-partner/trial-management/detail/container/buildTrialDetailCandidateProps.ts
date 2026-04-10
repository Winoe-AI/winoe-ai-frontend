import type { useTrialDetailCandidates } from './hooks/useTrialDetailCandidates';

type BuildCandidatePropsArgs = {
  inviteEnabled: boolean;
  inviteDisabledReason: string | null;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
  candidatesModel: ReturnType<typeof useTrialDetailCandidates>;
  onSubmitInvite: (name: string, email: string) => Promise<void>;
};

export function buildTrialDetailCandidateProps({
  inviteEnabled,
  inviteDisabledReason,
  inviteResendEnabled,
  inviteResendDisabledReason,
  candidatesModel,
  onSubmitInvite,
}: BuildCandidatePropsArgs) {
  return {
    inviteEnabled,
    inviteDisabledReason,
    inviteResendEnabled,
    inviteResendDisabledReason,
    candidates: candidatesModel.candidates,
    candidatesLoading: candidatesModel.loading,
    candidatesError: candidatesModel.error,
    reloadCandidates: candidatesModel.reload,
    search: candidatesModel.search,
    rowStates: candidatesModel.rowStates,
    onCopy: candidatesModel.handleCopy,
    onResend: candidatesModel.handleResend,
    onCloseManual: candidatesModel.closeManualCopy,
    cooldownNow: candidatesModel.cooldownTick,
    inviteModalOpen: candidatesModel.inviteModal.open,
    setInviteModalOpen: candidatesModel.inviteModal.setOpen,
    inviteFlowState: candidatesModel.inviteModal.inviteFlowState,
    submitInvite: onSubmitInvite,
    resetInviteFlow: candidatesModel.inviteModal.resetInviteFlow,
  };
}
