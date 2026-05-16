import { InviteCandidatesBatchModal } from '@/features/talent-partner/trial-management/invitations/InviteCandidatesBatchModal';
import type { InviteBatchUiState } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';
import type { InviteCandidateRow } from '@/features/talent-partner/trial-management/invitations/InviteBatchCandidateTypes';

type Props = {
  trialId: string;
  open: boolean;
  inviteFlowState: InviteBatchUiState;
  onClose: () => void;
  onSubmit: (rows: InviteCandidateRow[]) => Promise<void>;
};

export function TrialInviteModal({
  trialId,
  open,
  inviteFlowState,
  onClose,
  onSubmit,
}: Props) {
  return (
    <InviteCandidatesBatchModal
      open={open}
      title={`Trial ${trialId}`}
      state={inviteFlowState}
      onClose={onClose}
      onSubmit={(rows) => {
        void onSubmit(rows);
      }}
    />
  );
}
