import { useCallback, useState } from 'react';
import { useInviteCandidateFlow } from '@/features/recruiter/dashboard/hooks/useInviteCandidateFlow';
import { useInviteSubmit } from './useInviteSubmit';

type Params = {
  simulationId: string;
  reloadCandidates: () => void;
};

export function useSimulationInviteModal({
  simulationId,
  reloadCandidates,
}: Params) {
  const [open, setOpen] = useState(false);

  const inviteFlow = useInviteCandidateFlow(
    open
      ? {
          open: true,
          simulationId,
          simulationTitle: `Simulation ${simulationId}`,
        }
      : null,
  );

  const close = useCallback(() => {
    inviteFlow.reset();
    setOpen(false);
  }, [inviteFlow]);

  const submitInvite = useInviteSubmit({
    simulationId,
    inviteFlow,
    closeModal: close,
    reload: reloadCandidates,
  });

  return {
    open,
    openModal: useCallback(() => {
      inviteFlow.reset();
      setOpen(true);
    }, [inviteFlow]),
    close,
    setOpen,
    inviteFlowState: inviteFlow.state,
    submitInvite,
    resetInviteFlow: inviteFlow.reset,
  };
}
