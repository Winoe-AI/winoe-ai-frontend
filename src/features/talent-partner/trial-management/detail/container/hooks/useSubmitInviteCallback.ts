import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import type { InviteCandidateRow } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';
import { submitInviteAction } from '../actions/submitInviteAction';

type NotifyFn = (payload: ToastInput) => void;

type UseSubmitInviteCallbackArgs = {
  trialId: string;
  isTerminated: boolean;
  inviteDisabledReason: string | null;
  closeInviteModal: () => void;
  submitInvite: (rows: InviteCandidateRow[]) => Promise<void>;
  notify: NotifyFn;
  setActionError: Dispatch<SetStateAction<string | null>>;
};

export function useSubmitInviteCallback({
  trialId,
  isTerminated,
  inviteDisabledReason,
  closeInviteModal,
  submitInvite,
  notify,
  setActionError,
}: UseSubmitInviteCallbackArgs) {
  return useCallback(
    async (rows: InviteCandidateRow[]) => {
      await submitInviteAction({
        rows,
        isTerminated,
        inviteDisabledReason,
        trialId,
        setActionError,
        closeInviteModal,
        notify,
        submitInvite,
      });
    },
    [
      closeInviteModal,
      inviteDisabledReason,
      isTerminated,
      notify,
      setActionError,
      trialId,
      submitInvite,
    ],
  );
}
