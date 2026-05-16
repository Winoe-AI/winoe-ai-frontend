import { useCallback, useState } from 'react';
import { useInviteBatchCandidateFlow } from '@/features/talent-partner/dashboard/hooks/useInviteBatchCandidateFlow';
import { useInviteSubmit } from './useInviteSubmit';
import type { CandidateSession } from '@/features/talent-partner/types';

type Params = {
  trialId: string;
  reloadCandidates: () => Promise<CandidateSession[]>;
};

export function useTrialInviteModal({ trialId, reloadCandidates }: Params) {
  const [open, setOpen] = useState(false);

  const inviteFlow = useInviteBatchCandidateFlow(
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
    inviteFlow,
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
