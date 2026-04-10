import { useCallback, useState } from 'react';
import { useInviteCandidateFlow } from '@/features/talent-partner/dashboard/hooks/useInviteCandidateFlow';
import { useInviteSubmit } from './useInviteSubmit';

type Params = {
  trialId: string;
  reloadCandidates: () => void;
};

export function useTrialInviteModal({ trialId, reloadCandidates }: Params) {
  const [open, setOpen] = useState(false);

  const inviteFlow = useInviteCandidateFlow(
    open
      ? {
          open: true,
          trialId,
          trialTitle: `Trial ${trialId}`,
        }
      : null,
  );

  const close = useCallback(() => {
    inviteFlow.reset();
    setOpen(false);
  }, [inviteFlow]);

  const submitInvite = useInviteSubmit({
    trialId,
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
