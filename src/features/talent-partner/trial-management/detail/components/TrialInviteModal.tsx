import { InviteCandidateModal } from '@/features/talent-partner/trial-management/invitations/InviteCandidateModal';
import type { InviteUiState } from '@/features/talent-partner/trial-management/invitations/InviteCandidateTypes';

type Props = {
  trialId: string;
  open: boolean;
  inviteFlowState: InviteUiState;
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
  const state: InviteUiState = inviteFlowState;

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
