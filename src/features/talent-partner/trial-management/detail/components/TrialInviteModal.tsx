import { InviteCandidateModal } from '@/features/talent-partner/trial-management/invitations/InviteCandidateModal';
import type { InviteUiState } from '@/features/talent-partner/trial-management/invitations/InviteCandidateTypes';
import type { TrialDetailViewProps } from './types';

type Props = {
  trialId: string;
  open: boolean;
  inviteFlowState: TrialDetailViewProps['inviteFlowState'];
  onClose: () => void;
  onSubmit: (name: string, email: string) => Promise<void>;
};

export function TrialInviteModal({
  trialId,
  open,
  inviteFlowState,
  onClose,
  onSubmit,
}: Props) {
  const state: InviteUiState =
    inviteFlowState.status === 'error'
      ? { status: 'error', message: inviteFlowState.message ?? '' }
      : inviteFlowState.status === 'loading'
        ? { status: 'loading' }
        : inviteFlowState.status === 'success'
          ? { status: 'success', message: inviteFlowState.message || undefined }
          : { status: 'idle' };

  return (
    <InviteCandidateModal
      open={open}
      title={`Trial ${trialId}`}
      state={state}
      onClose={onClose}
      onSubmit={onSubmit}
      initialName=""
      initialEmail=""
    />
  );
}
