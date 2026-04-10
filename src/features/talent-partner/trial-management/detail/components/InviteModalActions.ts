'use client';

import { useCallback } from 'react';
import type { TrialDetailViewProps } from './types';

type InviteModalDeps = Pick<
  TrialDetailViewProps,
  'resetInviteFlow' | 'setInviteModalOpen' | 'inviteEnabled'
>;

export function useInviteModalActions({
  resetInviteFlow,
  setInviteModalOpen,
  inviteEnabled,
}: InviteModalDeps) {
  const openInviteModal = useCallback(() => {
    if (!inviteEnabled) return;
    resetInviteFlow();
    setInviteModalOpen(true);
  }, [inviteEnabled, resetInviteFlow, setInviteModalOpen]);

  const closeInviteModal = useCallback(() => {
    resetInviteFlow();
    setInviteModalOpen(false);
  }, [resetInviteFlow, setInviteModalOpen]);

  return { openInviteModal, closeInviteModal };
}
