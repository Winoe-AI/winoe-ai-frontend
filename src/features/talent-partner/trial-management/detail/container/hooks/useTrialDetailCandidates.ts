import { useCandidateRowActions } from '../../hooks/useCandidateRowActions';
import { useCandidatesSearch } from '../../hooks/useCandidatesSearch';
import { useCooldownTick } from '../../hooks/useCooldownTick';
import { useTrialCandidates } from '../../hooks/useTrialCandidates';
import { useTrialInviteModal } from '../../hooks/useTrialInviteModal';

type UseTrialDetailCandidatesArgs = {
  trialId: string;
  candidatesEnabled: boolean;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
};

export function useTrialDetailCandidates({
  trialId,
  candidatesEnabled,
  inviteResendEnabled,
  inviteResendDisabledReason,
}: UseTrialDetailCandidatesArgs) {
  const { candidates, loading, error, reload, setCandidates } =
    useTrialCandidates({ trialId, enabled: candidatesEnabled });
  const search = useCandidatesSearch({ candidates, pageSize: 25 });
  const { rowStates, handleCopy, handleResend, closeManualCopy } =
    useCandidateRowActions(
      trialId,
      reload,
      setCandidates,
      inviteResendEnabled,
      inviteResendDisabledReason,
    );
  const inviteModal = useTrialInviteModal({
    trialId,
    reloadCandidates: reload,
  });
  const cooldownTick = useCooldownTick(rowStates);

  return {
    candidates,
    loading,
    error,
    reload,
    search,
    rowStates,
    handleCopy,
    handleResend,
    closeManualCopy,
    inviteModal,
    cooldownTick,
  };
}
