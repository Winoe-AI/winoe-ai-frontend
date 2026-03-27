import type { Dispatch, SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';

type NotifyFn = (payload: ToastInput) => void;

type SubmitInviteArgs = {
  candidateName: string;
  inviteEmail: string;
  isTerminated: boolean;
  inviteDisabledReason: string | null;
  simulationId: string;
  setActionError: Dispatch<SetStateAction<string | null>>;
  closeInviteModal: () => void;
  notify: NotifyFn;
  submitInvite: (candidateName: string, inviteEmail: string) => Promise<void>;
};

export async function submitInviteAction({
  candidateName,
  inviteEmail,
  isTerminated,
  inviteDisabledReason,
  simulationId,
  setActionError,
  closeInviteModal,
  notify,
  submitInvite,
}: SubmitInviteArgs): Promise<void> {
  if (isTerminated) {
    const message =
      inviteDisabledReason ??
      'This simulation has been terminated. Invites are disabled immediately.';
    setActionError(message);
    notify({
      id: `invite-disabled-${simulationId}`,
      tone: 'error',
      title: 'Invites are disabled',
      description: message,
    });
    closeInviteModal();
    return;
  }
  await submitInvite(candidateName, inviteEmail);
}
