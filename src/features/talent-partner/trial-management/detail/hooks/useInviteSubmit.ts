import { useCallback } from 'react';
import { useInviteToasts } from '@/features/talent-partner/trial-management/invitations/useInviteToasts';
import type { InviteSuccess } from '@/features/talent-partner/types';

type InviteFlow = {
  submit: (name: string, email: string) => Promise<InviteSuccess | null>;
};

type Params = {
  trialId: string;
  inviteFlow: InviteFlow;
  closeModal: () => void;
  reload: () => void;
};

export function useInviteSubmit({
  trialId,
  inviteFlow,
  closeModal,
  reload,
}: Params) {
  const { showInviteToast } = useInviteToasts();

  return useCallback(
    async (candidateName: string, inviteEmail: string) => {
      const res = await inviteFlow.submit(candidateName, inviteEmail);
      if (!res) return;
      closeModal();
      showInviteToast({
        ...res,
        trialId,
        candidateName,
        candidateEmail: inviteEmail,
      });
      reload();
    },
    [closeModal, inviteFlow, reload, showInviteToast, trialId],
  );
}
