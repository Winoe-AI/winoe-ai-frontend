import type { TrialInviteResultItem } from '@/features/talent-partner/api/invitesBatchApi';

export type InviteCandidateRow = { name: string; email: string };

export type InviteBatchUiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'success';
      message: string;
      invites: TrialInviteResultItem[];
    };
