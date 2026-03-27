import { useCandidateRowActions } from '../../hooks/useCandidateRowActions';
import { useCandidatesSearch } from '../../hooks/useCandidatesSearch';
import { useCooldownTick } from '../../hooks/useCooldownTick';
import { useSimulationCandidates } from '../../hooks/useSimulationCandidates';
import { useSimulationInviteModal } from '../../hooks/useSimulationInviteModal';

type UseSimulationDetailCandidatesArgs = {
  simulationId: string;
  candidatesEnabled: boolean;
  inviteResendEnabled: boolean;
  inviteResendDisabledReason: string | null;
};

export function useSimulationDetailCandidates({
  simulationId,
  candidatesEnabled,
  inviteResendEnabled,
  inviteResendDisabledReason,
}: UseSimulationDetailCandidatesArgs) {
  const { candidates, loading, error, reload, setCandidates } =
    useSimulationCandidates({ simulationId, enabled: candidatesEnabled });
  const search = useCandidatesSearch({ candidates, pageSize: 25 });
  const { rowStates, handleCopy, handleResend, closeManualCopy } =
    useCandidateRowActions(
      simulationId,
      reload,
      setCandidates,
      inviteResendEnabled,
      inviteResendDisabledReason,
    );
  const inviteModal = useSimulationInviteModal({
    simulationId,
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
