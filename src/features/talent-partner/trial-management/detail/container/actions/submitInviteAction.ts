import type { Dispatch, SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import type { InviteCandidateRow } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';

type NotifyFn = (payload: ToastInput) => void;

type SubmitInviteArgs = {
  rows: InviteCandidateRow[];
  isTerminated: boolean;
  inviteDisabledReason: string | null;
  trialId: string;
  setActionError: Dispatch<SetStateAction<string | null>>;
  closeInviteModal: () => void;
  notify: NotifyFn;
  submitInvite: (rows: InviteCandidateRow[]) => Promise<void>;
};

export async function submitInviteAction({
  rows,
  isTerminated,
  inviteDisabledReason,
  trialId,
  setActionError,
  closeInviteModal,
  notify,
  submitInvite,
}: SubmitInviteArgs): Promise<void> {
  if (isTerminated) {
    const message =
      inviteDisabledReason ??
      'This Trial has been terminated. Invites are disabled immediately.';
    setActionError(message);
    notify({
      id: `invite-disabled-${trialId}`,
      tone: 'error',
      title: 'Invites are disabled',
      description: message,
    });
    closeInviteModal();
    return;
  }
  await submitInvite(rows);
}
