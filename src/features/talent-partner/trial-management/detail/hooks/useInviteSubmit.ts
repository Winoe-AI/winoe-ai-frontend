import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useInviteToasts } from '@/features/talent-partner/trial-management/invitations/useInviteToasts';
import type {
  CandidateSession,
  InviteSuccess,
} from '@/features/talent-partner/types';
import type { InviteUiState } from '@/features/talent-partner/trial-management/invitations/InviteCandidateTypes';
import {
  buildInviteModalState,
  findInvitedCandidate,
} from './inviteCandidateReconciliation';

type InviteFlow = {
  submit: (name: string, email: string) => Promise<InviteSuccess | null>;
  setState: Dispatch<SetStateAction<InviteUiState>>;
};

type Params = {
  trialId: string;
  inviteFlow: InviteFlow;
  reload: () => Promise<CandidateSession[]>;
};

export function useInviteSubmit({ trialId, inviteFlow, reload }: Params) {
  const { showInviteToast } = useInviteToasts();

  return useCallback(
    async (candidateName: string, inviteEmail: string) => {
      const res = await inviteFlow.submit(candidateName, inviteEmail);
      if (!res) return;
      inviteFlow.setState({ status: 'loading' });
      const candidates = await reload().catch(() => [] as CandidateSession[]);
      const candidate = findInvitedCandidate(candidates, res);
      const finalState = buildInviteModalState({ invite: res, candidate });
      inviteFlow.setState(finalState);
      if (finalState.status === 'success') {
        showInviteToast({
          ...res,
          trialId,
          candidateName,
          candidateEmail: inviteEmail,
        });
      }
    },
    [inviteFlow, reload, showInviteToast, trialId],
  );
}
