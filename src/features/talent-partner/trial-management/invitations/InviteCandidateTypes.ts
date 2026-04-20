export type InviteSubmissionMeta = {
  inviteUrl?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateSessionId?: string;
  outcome?: 'created' | 'resent';
  inviteEmailStatus?: string | null;
};

export type InviteUiState =
  | { status: 'idle' }
  | { status: 'loading' }
  | ({ status: 'error'; message: string } & InviteSubmissionMeta)
  | ({ status: 'success'; message?: string } & InviteSubmissionMeta)
  | ({ status: 'warning'; message: string } & InviteSubmissionMeta);
