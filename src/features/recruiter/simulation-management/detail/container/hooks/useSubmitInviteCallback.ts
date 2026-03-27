import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { ToastInput } from '@/shared/notifications/types';
import { submitInviteAction } from '../actions/submitInviteAction';

type NotifyFn = (payload: ToastInput) => void;

type UseSubmitInviteCallbackArgs = {
  simulationId: string;
  isTerminated: boolean;
  inviteDisabledReason: string | null;
  closeInviteModal: () => void;
  submitInvite: (candidateName: string, inviteEmail: string) => Promise<void>;
  notify: NotifyFn;
  setActionError: Dispatch<SetStateAction<string | null>>;
};

export function useSubmitInviteCallback({
  simulationId,
  isTerminated,
  inviteDisabledReason,
  closeInviteModal,
  submitInvite,
  notify,
  setActionError,
}: UseSubmitInviteCallbackArgs) {
  return useCallback(
    async (candidateName: string, inviteEmail: string) => {
      await submitInviteAction({
        candidateName,
        inviteEmail,
        isTerminated,
        inviteDisabledReason,
        simulationId,
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
      simulationId,
      submitInvite,
    ],
  );
}
