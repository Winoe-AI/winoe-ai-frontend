import { useMemo, useState } from 'react';
import { useInviteCandidateFlow } from './useInviteCandidateFlow';
import type { InviteModalState } from '../types';
import type { InviteUiState } from '@/features/talent-partner/trial-management/invitations/InviteCandidateTypes';

export function useInviteModalState() {
  const [modal, setModal] = useState<InviteModalState>({
    open: false,
    trialId: '',
    trialTitle: '',
  });

  const inviteFlow = useInviteCandidateFlow(modal.open ? modal : null);

  const inviteWho = useMemo(() => modal.trialTitle || '', [modal]);

  const modalState: InviteUiState =
    inviteFlow.state.status === 'error'
      ? { status: 'error', message: inviteFlow.state.message ?? '' }
      : { status: inviteFlow.state.status };

  const openInvite = (simId: string, simTitle: string) => {
    inviteFlow.reset();
    setModal({ open: true, trialId: simId, trialTitle: simTitle });
  };

  const closeModal = () =>
    setModal({ open: false, trialId: '', trialTitle: '' });

  return { modal, inviteFlow, inviteWho, modalState, openInvite, closeModal };
}
